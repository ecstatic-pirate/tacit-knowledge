import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import type { SearchResult, MessageSource, Json } from '@/types'

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

// Embedding model constants
const EMBEDDING_MODEL = 'text-embedding-ada-002'
const EMBEDDING_DIMENSIONS = 1536

// Chat model constants
const CHAT_MODEL = 'gpt-4o'
const FAST_CHAT_MODEL = 'gpt-4o-mini'

/**
 * Generate embeddings for a text using OpenAI's ada-002 model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient()

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  })

  return response.data[0].embedding
}

/**
 * Search knowledge embeddings using vector similarity
 */
export async function searchKnowledge(
  query: string,
  orgId: string,
  options: {
    matchThreshold?: number
    matchCount?: number
    campaignId?: string
    contentTypes?: ('transcript' | 'insight' | 'graph_node' | 'document')[]
  } = {}
): Promise<SearchResult[]> {
  const {
    matchThreshold = 0.7,
    matchCount = 10,
    campaignId,
    contentTypes,
  } = options

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query)

  // Search using the Supabase RPC function
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('search_knowledge', {
    query_embedding: queryEmbedding as unknown as string,
    match_threshold: matchThreshold,
    match_count: matchCount,
    filter_org_id: orgId,
    filter_campaign_id: campaignId,
    filter_content_types: contentTypes,
  })

  if (error) {
    console.error('Error searching knowledge:', error)
    throw error
  }

  return (data || []).map((row) => ({
    id: row.id,
    contentType: row.content_type as SearchResult['contentType'],
    contentId: row.content_id,
    campaignId: row.campaign_id,
    chunkText: row.chunk_text,
    metadata: (typeof row.metadata === 'object' && row.metadata !== null)
      ? row.metadata as Record<string, unknown>
      : null,
    similarity: row.similarity,
  }))
}

/**
 * Convert search results to message sources for display
 */
export function searchResultsToSources(results: SearchResult[]): MessageSource[] {
  return results.map((result) => ({
    type: result.contentType,
    id: result.contentId,
    title: (result.metadata?.title as string) || getDefaultTitle(result.contentType),
    excerpt: result.chunkText.slice(0, 200) + (result.chunkText.length > 200 ? '...' : ''),
    relevanceScore: result.similarity,
    metadata: result.metadata ?? undefined,
  }))
}

function getDefaultTitle(contentType: string): string {
  switch (contentType) {
    case 'transcript':
      return 'Interview Transcript'
    case 'insight':
      return 'Captured Insight'
    case 'graph_node':
      return 'Knowledge Node'
    case 'document':
      return 'Document'
    default:
      return 'Knowledge Item'
  }
}

/**
 * Generate a contextual prompt with retrieved knowledge
 */
function buildRAGPrompt(
  userQuery: string,
  searchResults: SearchResult[],
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): string {
  const contextChunks = searchResults
    .map((result, index) => {
      const sourceType = result.contentType.replace('_', ' ')
      return `[Source ${index + 1} - ${sourceType}]\n${result.chunkText}`
    })
    .join('\n\n')

  const historyText = conversationHistory
    .slice(-6) // Keep last 6 messages for context
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n')

  return `You are a knowledge concierge assistant helping users explore captured organizational knowledge.

Based on the following retrieved knowledge sources:

${contextChunks || 'No specific sources found for this query.'}

${historyText ? `Previous conversation:\n${historyText}\n` : ''}
User question: ${userQuery}

Instructions:
- Answer the user's question based on the retrieved knowledge sources
- If the sources contain relevant information, cite them using [Source N] notation
- If the sources don't contain relevant information, say so honestly
- Be concise but thorough
- If you make inferences or connections between sources, note that
- Maintain a helpful, professional tone`
}

/**
 * Generate a chat response using RAG
 */
export async function generateRAGResponse(
  userQuery: string,
  orgId: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  options: {
    campaignId?: string
    contentTypes?: ('transcript' | 'insight' | 'graph_node' | 'document')[]
    matchCount?: number
    useFastModel?: boolean
  } = {}
): Promise<{
  response: string
  sources: MessageSource[]
}> {
  const { campaignId, contentTypes, matchCount = 8, useFastModel = false } = options

  // Search for relevant knowledge
  const searchResults = await searchKnowledge(userQuery, orgId, {
    campaignId,
    contentTypes,
    matchCount,
  })

  // Build the RAG prompt
  const prompt = buildRAGPrompt(userQuery, searchResults, conversationHistory)

  // Generate response
  const openai = getOpenAIClient()
  const completion = await openai.chat.completions.create({
    model: useFastModel ? FAST_CHAT_MODEL : CHAT_MODEL,
    messages: [
      {
        role: 'system',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  })

  const response = completion.choices[0]?.message?.content || 'I was unable to generate a response.'

  return {
    response,
    sources: searchResultsToSources(searchResults),
  }
}

/**
 * Generate a streaming chat response using RAG
 */
export async function* generateRAGResponseStream(
  userQuery: string,
  orgId: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  options: {
    campaignId?: string
    contentTypes?: ('transcript' | 'insight' | 'graph_node' | 'document')[]
    matchCount?: number
  } = {}
): AsyncGenerator<{ type: 'sources' | 'delta' | 'done'; data: unknown }> {
  const { campaignId, contentTypes, matchCount = 8 } = options

  // Search for relevant knowledge first
  const searchResults = await searchKnowledge(userQuery, orgId, {
    campaignId,
    contentTypes,
    matchCount,
  })

  // Yield sources immediately
  yield {
    type: 'sources',
    data: searchResultsToSources(searchResults),
  }

  // Build the RAG prompt
  const prompt = buildRAGPrompt(userQuery, searchResults, conversationHistory)

  // Generate streaming response
  const openai = getOpenAIClient()
  const stream = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: 'system',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
    stream: true,
  })

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) {
      yield {
        type: 'delta',
        data: delta,
      }
    }
  }

  yield {
    type: 'done',
    data: null,
  }
}

/**
 * Create or update knowledge embeddings for content
 */
export async function createEmbeddings(
  orgId: string,
  content: {
    type: 'transcript' | 'insight' | 'graph_node' | 'document'
    id: string
    text: string
    campaignId?: string
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  const supabase = await createClient()

  // Split text into chunks (simple chunking for now)
  const chunks = chunkText(content.text, 1000, 200)

  // Generate embeddings for each chunk
  const embeddings = await Promise.all(
    chunks.map((chunk) => generateEmbedding(chunk))
  )

  // Delete existing embeddings for this content
  await supabase
    .from('knowledge_embeddings')
    .delete()
    .eq('content_id', content.id)
    .eq('content_type', content.type)

  // Insert new embeddings
  const embeddingRecords = chunks.map((chunk, index) => ({
    org_id: orgId,
    content_type: content.type as string,
    content_id: content.id,
    campaign_id: content.campaignId ?? null,
    chunk_text: chunk,
    chunk_index: index,
    metadata: (content.metadata ?? {}) as Json,
    embedding: embeddings[index] as unknown as string,
  }))

  const { error } = await supabase
    .from('knowledge_embeddings')
    .insert(embeddingRecords)

  if (error) {
    console.error('Error creating embeddings:', error)
    throw error
  }
}

/**
 * Simple text chunking with overlap
 */
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.slice(start, end))
    start += chunkSize - overlap

    // Avoid creating tiny final chunks
    if (text.length - start < chunkSize / 2) {
      if (chunks.length > 0) {
        chunks[chunks.length - 1] = text.slice(start - (chunkSize - overlap))
      }
      break
    }
  }

  return chunks
}
