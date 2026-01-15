import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRAGResponseStream } from '@/lib/concierge'
import type { Json } from '@/lib/supabase/database.types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Get user's org_id
  const { data: appUser, error: userError } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (userError || !appUser) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Parse request body
  const body = await request.json()
  const {
    conversationId,
    message,
    campaignId,
    contentTypes,
  } = body as {
    conversationId: string
    message: string
    campaignId?: string
    contentTypes?: ('transcript' | 'insight' | 'graph_node' | 'document')[]
  }

  if (!conversationId || !message) {
    return new Response(JSON.stringify({ error: 'conversationId and message are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Verify conversation belongs to user
  const { data: conversation, error: convError } = await supabase
    .from('concierge_conversations')
    .select('id, org_id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (convError || !conversation) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Fetch conversation history for context
  const { data: historyMessages } = await supabase
    .from('concierge_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(10)

  const conversationHistory = (historyMessages || []).map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }))

  // Fetch campaign details if campaignId is provided
  let campaignContext: { name: string; type: 'person' | 'project'; role?: string } | undefined
  if (campaignId) {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('expert_name, expert_role, subject_type')
      .eq('id', campaignId)
      .single()

    if (campaign) {
      campaignContext = {
        name: campaign.expert_name,
        type: (campaign.subject_type as 'person' | 'project') || 'person',
        role: campaign.expert_role || undefined,
      }
    }
  }

  // Save user message
  const { data: userMessage, error: userMsgError } = await supabase
    .from('concierge_messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content: message,
    })
    .select()
    .single()

  if (userMsgError) {
    console.error('Error saving user message:', userMsgError)
    return new Response(JSON.stringify({ error: 'Failed to save message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Create streaming response
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = ''
        let sources: unknown[] = []

        // Generate streaming response
        const responseStream = generateRAGResponseStream(
          message,
          conversation.org_id,
          conversationHistory,
          { campaignId, campaignContext, contentTypes }
        )

        for await (const chunk of responseStream) {
          if (chunk.type === 'sources') {
            sources = chunk.data as unknown[]
            // Send sources first
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`)
            )
          } else if (chunk.type === 'delta') {
            fullResponse += chunk.data as string
            // Stream delta
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'delta', delta: chunk.data })}\n\n`)
            )
          } else if (chunk.type === 'done') {
            // Save assistant message
            const { data: assistantMessage, error: assistantError } = await supabase
              .from('concierge_messages')
              .insert({
                conversation_id: conversationId,
                role: 'assistant',
                content: fullResponse,
                sources: sources as unknown as Json,
              })
              .select()
              .single()

            if (assistantError) {
              console.error('Error saving assistant message:', assistantError)
            }

            // Update conversation title if it's the first message
            if (conversationHistory.length === 0) {
              // Generate a title from the first message
              const title = message.slice(0, 50) + (message.length > 50 ? '...' : '')
              await supabase
                .from('concierge_conversations')
                .update({ title })
                .eq('id', conversationId)
            }

            // Send done signal with message IDs
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'done',
                  userMessageId: userMessage?.id,
                  assistantMessageId: assistantMessage?.id,
                })}\n\n`
              )
            )
          }
        }

        controller.close()
      } catch (error) {
        console.error('Error generating response:', error)
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', error: 'Failed to generate response' })}\n\n`
          )
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
