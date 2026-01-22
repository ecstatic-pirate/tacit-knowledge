import OpenAI from 'openai'

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

// Model constants - Updated to GPT-5 family
export const MODELS = {
  FAST: 'gpt-5-mini',       // Fast responses, cost-optimized
  STANDARD: 'gpt-5.2',      // Best for complex reasoning and broad world knowledge
  REASONING: 'gpt-5.2',     // For complex analysis and multi-step tasks
} as const

export type ModelType = keyof typeof MODELS

// Document analysis types
export interface DocumentAnalysisResult {
  topics: string[]
  entities: { name: string; type: 'person' | 'system' | 'process' | 'tool' | 'concept' }[]
  gaps: string[]
  summary: string
}

// Interview plan types
export interface GeneratedQuestion {
  question: string
  priority: 'high' | 'medium' | 'low'
  category: string
  relatedGap?: string
}

export interface InterviewPlanResult {
  questions: GeneratedQuestion[]
  gaps: string[]
  topics: string[]
  contextSummary: string
}

// Session guidance types
export interface SessionGuidanceResult {
  suggestedQuestions: string[]
  detectedTopics: string[]
  topicsToProbe: string[]
  contextualTip: string
}

/**
 * Analyze a document and extract topics, entities, gaps, and summary
 */
export async function analyzeDocument(
  documentText: string,
  filename: string
): Promise<DocumentAnalysisResult> {
  const openai = getOpenAIClient()
  const response = await openai.responses.create({
    model: MODELS.FAST,
    input: `You are an expert at analyzing documents to extract knowledge for interview preparation.

Analyze this document and extract:
1. Main topics covered (list of 3-8 topic names)
2. Key entities mentioned (people, systems, processes, tools, concepts)
3. Knowledge gaps (things mentioned but not fully explained, or implied but unclear)
4. A brief summary (2-3 sentences)

Document filename: ${filename}

Document content:
${documentText.slice(0, 15000)}

Respond in JSON format:
{
  "topics": ["topic1", "topic2", ...],
  "entities": [{"name": "Entity Name", "type": "person|system|process|tool|concept"}, ...],
  "gaps": ["gap description 1", "gap description 2", ...],
  "summary": "Brief summary of the document..."
}`,
  })

  try {
    const text = response.output_text || ''
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as DocumentAnalysisResult
    }
    throw new Error('No JSON found in response')
  } catch {
    // Return a default structure if parsing fails
    return {
      topics: [],
      entities: [],
      gaps: ['Unable to analyze document'],
      summary: 'Document analysis failed',
    }
  }
}

/**
 * Generate an interview plan based on documents and self-assessment
 */
export async function generateInterviewPlan(
  expertName: string,
  expertRole: string,
  goal: string,
  documentSummaries: { filename: string; summary: string; topics: string[]; gaps: string[] }[],
  selfAssessment: {
    what_you_know?: string
    questions_people_ask?: string[]
    what_will_break?: string
    topics_to_cover?: string[]
  }
): Promise<InterviewPlanResult> {
  const docContext = documentSummaries.map(d =>
    `- ${d.filename}: ${d.summary}\n  Topics: ${d.topics.join(', ')}\n  Gaps: ${d.gaps.join(', ')}`
  ).join('\n\n')

  const selfAssessmentText = `
What they know: ${selfAssessment.what_you_know || 'Not provided'}
Questions people ask them: ${selfAssessment.questions_people_ask?.join(', ') || 'Not provided'}
What might become challenging: ${selfAssessment.what_will_break || 'Not provided'}
Topics they want to cover: ${selfAssessment.topics_to_cover?.join(', ') || 'Not provided'}
`

  const openai = getOpenAIClient()
  const response = await openai.responses.create({
    model: MODELS.STANDARD,
    input: `You are an expert interviewer preparing to capture tacit knowledge from an expert.

Expert: ${expertName}
Role: ${expertRole}
Goal: ${goal}

Documents analyzed:
${docContext || 'No documents uploaded'}

Self-assessment from expert:
${selfAssessmentText}

Based on this context, generate:
1. Top 10-15 interview questions prioritized by importance
2. Key knowledge gaps to probe (things not documented or unclear)
3. Main topics that should be covered
4. A brief context summary for the interviewer (3-4 sentences)

Focus questions on:
- Undocumented processes and workarounds
- Decision rationale ("why" questions)
- Edge cases and gotchas
- Relationships and who to contact
- What might be challenging without this knowledge

Respond in JSON format:
{
  "questions": [
    {"question": "...", "priority": "high|medium|low", "category": "process|decision|edge_case|relationship|handoff", "relatedGap": "optional gap this addresses"},
    ...
  ],
  "gaps": ["gap1", "gap2", ...],
  "topics": ["topic1", "topic2", ...],
  "contextSummary": "Brief summary for interviewer..."
}`,
  })

  try {
    const text = response.output_text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as InterviewPlanResult
    }
    throw new Error('No JSON found in response')
  } catch {
    return {
      questions: [
        { question: 'Can you walk me through your typical day?', priority: 'high', category: 'process' },
        { question: 'What will be the hardest thing for your replacement?', priority: 'high', category: 'handoff' },
      ],
      gaps: ['Unable to generate gaps'],
      topics: ['general'],
      contextSummary: 'Interview plan generation failed. Please use the default questions.',
    }
  }
}

/**
 * Get real-time guidance during an interview session
 */
export async function getSessionGuidance(
  expertName: string,
  goal: string,
  plannedQuestions: string[],
  topicsCovered: string[],
  recentTranscript: string,
  focusTopic?: string
): Promise<SessionGuidanceResult> {
  const openai = getOpenAIClient()

  // Build the prompt based on whether a focus topic is specified
  const focusInstruction = focusTopic
    ? `IMPORTANT: The interviewer wants to focus on the topic "${focusTopic}". Generate 3 specific, probing questions about this topic to help extract deep tacit knowledge.`
    : `Based on what was just discussed, provide 3 follow-up questions to dig deeper into what was just said.`

  const response = await openai.responses.create({
    model: MODELS.FAST,
    input: `You are an AI coach helping an interviewer capture tacit knowledge in real-time.

Expert being interviewed: ${expertName}
Interview goal: ${goal}

${focusTopic ? `FOCUS TOPIC: ${focusTopic}` : ''}

Planned questions (not yet asked):
${plannedQuestions.slice(0, 5).map((q, i) => `${i + 1}. ${q}`).join('\n')}

Topics already covered: ${topicsCovered.join(', ') || 'None yet'}

Recent transcript (last few minutes):
${recentTranscript.slice(-3000) || 'No transcript yet'}

${focusInstruction}

Also provide:
- Topics detected in the recent conversation
- Topics or knowledge areas to probe further
- A brief tip for the interviewer

Respond in JSON format:
{
  "suggestedQuestions": ["question1", "question2", "question3"],
  "detectedTopics": ["topic1", "topic2"],
  "topicsToProbe": ["topic1", "topic2"],
  "contextualTip": "Brief tip for the interviewer..."
}`,
  })

  try {
    const text = response.output_text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as SessionGuidanceResult
    }
    throw new Error('No JSON found in response')
  } catch {
    return {
      suggestedQuestions: [
        'Can you give me a specific example of that?',
        'What happens when that approach doesn\'t work?',
        'Who else should know about this?',
      ],
      detectedTopics: [],
      topicsToProbe: [],
      contextualTip: 'Ask for specific examples to capture actionable knowledge.',
    }
  }
}

/**
 * Extract insights from a completed session transcript
 */
export async function extractSessionInsights(
  expertName: string,
  transcript: string
): Promise<{ title: string; insight: string; confidence: number }[]> {
  const openai = getOpenAIClient()
  const response = await openai.responses.create({
    model: MODELS.STANDARD,
    input: `You are an expert at extracting key insights from interview transcripts.

Analyze this interview transcript with ${expertName} and extract the key insights - specific pieces of tacit knowledge that were captured.

Focus on:
- Undocumented processes or workarounds
- Decision rationale and reasoning
- Edge cases and gotchas
- Relationships and contacts
- Tips and best practices

Transcript:
${transcript.slice(0, 20000)}

Extract 5-15 distinct insights. Each insight should be a specific, actionable piece of knowledge.

Respond in JSON format:
{
  "insights": [
    {"title": "Short title", "insight": "Detailed insight description...", "confidence": 0.8},
    ...
  ]
}`,
  })

  try {
    const text = response.output_text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return result.insights || []
    }
    throw new Error('No JSON found in response')
  } catch {
    return []
  }
}

/**
 * Real-time topic extraction from transcript chunk
 * Used during interviews to update knowledge graph coverage
 */
export interface TopicExtractionResult {
  topicsMentioned: { topic: string; confidence: number; context: string }[]
  entitiesFound: { name: string; type: 'person' | 'system' | 'process' | 'tool' | 'concept' }[]
  suggestedFollowUp: string | null
}

export async function extractTopicsFromTranscript(
  recentTranscript: string,
  topicsToLookFor: string[],
  expertName: string
): Promise<TopicExtractionResult> {
  const openai = getOpenAIClient()
  const response = await openai.responses.create({
    model: MODELS.FAST,
    input: `You are analyzing a live interview transcript to detect when specific topics are being discussed.

Expert being interviewed: ${expertName}

Topics we're looking for (from their self-assessment):
${topicsToLookFor.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Recent transcript chunk:
${recentTranscript.slice(-4000)}

Analyze this transcript and identify:
1. Which of the listed topics were mentioned or discussed (even partially)
2. Any new entities (people, systems, processes, tools, concepts) mentioned
3. A suggested follow-up question if the expert mentioned something interesting but didn't elaborate

Be conservative - only mark a topic as mentioned if there's clear evidence in the transcript.

Respond in JSON format:
{
  "topicsMentioned": [
    {"topic": "exact topic name from list", "confidence": 0.7, "context": "brief quote or paraphrase from transcript"},
    ...
  ],
  "entitiesFound": [
    {"name": "Entity Name", "type": "person|system|process|tool|concept"},
    ...
  ],
  "suggestedFollowUp": "Optional follow-up question or null"
}`,
  })

  try {
    const text = response.output_text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as TopicExtractionResult
    }
    throw new Error('No JSON found in response')
  } catch {
    return {
      topicsMentioned: [],
      entitiesFound: [],
      suggestedFollowUp: null,
    }
  }
}

/**
 * Analyze documents for campaign creation - suggests domains/topics or focus areas
 * Used during the campaign creation flow after documents are uploaded
 */
export interface DocumentSuggestionResult {
  // For Expert campaigns
  suggestedDomains: { name: string; confidence: number; description: string }[]
  suggestedTopics: string[]
  // For Project campaigns
  suggestedFocusAreas: { area: string; description: string; priority: 'high' | 'medium' | 'low' }[]
  // Common
  keyTopics: string[]
  knowledgeGaps: string[]
  summary: string
}

export async function analyzeDocumentsForCampaign(
  documentContents: { filename: string; content: string }[],
  campaignType: 'person' | 'project',
  contextInfo?: {
    expertName?: string
    expertRole?: string
    projectName?: string
    projectDescription?: string
  }
): Promise<DocumentSuggestionResult> {
  const openai = getOpenAIClient()

  const documentsText = documentContents
    .map(doc => `=== ${doc.filename} ===\n${doc.content.slice(0, 10000)}`)
    .join('\n\n')
    .slice(0, 50000) // Limit total content

  const contextPrompt = campaignType === 'person'
    ? `Expert Name: ${contextInfo?.expertName || 'Unknown'}
Expert Role: ${contextInfo?.expertRole || 'Unknown'}`
    : `Project Name: ${contextInfo?.projectName || 'Unknown'}
Project Description: ${contextInfo?.projectDescription || 'Not provided'}`

  const analysisPrompt = campaignType === 'person'
    ? `Analyze these documents to understand an expert's knowledge domains and topics.

${contextPrompt}

Documents uploaded:
${documentsText}

Based on these documents, identify:
1. Knowledge domains this expert owns (areas of expertise) - be specific
2. Technical and soft topics evident from the documents
3. Key topics covered in the documents
4. Knowledge gaps (things mentioned but not fully explained)
5. A brief summary of the expert's knowledge base

Respond in JSON format:
{
  "suggestedDomains": [
    {"name": "Domain Name", "confidence": 0.8, "description": "Why this domain"},
    ...
  ],
  "suggestedTopics": ["Topic 1", "Topic 2", ...],
  "suggestedFocusAreas": [],
  "keyTopics": ["Topic 1", "Topic 2", ...],
  "knowledgeGaps": ["Gap 1", "Gap 2", ...],
  "summary": "Brief summary of knowledge base..."
}`
    : `Analyze these documents to understand a project and identify focus areas for knowledge capture.

${contextPrompt}

Documents uploaded:
${documentsText}

Based on these documents, identify:
1. Focus areas for knowledge capture (what aspects of this project need documentation)
2. Key topics covered in the documents
3. Knowledge gaps (things mentioned but not fully explained, or missing documentation)
4. A brief summary of the project context

Respond in JSON format:
{
  "suggestedDomains": [],
  "suggestedTopics": [],
  "suggestedFocusAreas": [
    {"area": "Focus Area Name", "description": "Why this needs capture", "priority": "high|medium|low"},
    ...
  ],
  "keyTopics": ["Topic 1", "Topic 2", ...],
  "knowledgeGaps": ["Gap 1", "Gap 2", ...],
  "summary": "Brief summary of project context..."
}`

  const response = await openai.responses.create({
    model: MODELS.STANDARD,
    input: analysisPrompt,
  })

  try {
    const text = response.output_text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as DocumentSuggestionResult
    }
    throw new Error('No JSON found in response')
  } catch {
    return {
      suggestedDomains: [],
      suggestedTopics: [],
      suggestedFocusAreas: [],
      keyTopics: [],
      knowledgeGaps: ['Unable to analyze documents'],
      summary: 'Document analysis failed. Please try again.',
    }
  }
}

export default getOpenAIClient
