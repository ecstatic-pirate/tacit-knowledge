import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, SelfAssessment } from '@/lib/supabase/database.types'

// Role labels for display
const roleLabels: Record<string, string> = {
  successor: 'Successor',
  teammate: 'Teammate',
  partner: 'Partner',
  manager: 'Manager',
  report: 'Direct Report',
}

// Create a Supabase client for public API access
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient<Database>(supabaseUrl, supabaseKey)
}

interface SessionAiTopic {
  topic: string
  description?: string
  questions?: string[]
}

// GET: Fetch guide data by token
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Find campaign by interviewer_guide_token
  const { data: campaignData, error: campaignError } = await supabase
    .from('campaigns')
    .select(`
      id,
      expert_name,
      expert_role,
      goal,
      departure_date,
      self_assessment
    `)
    .eq('interviewer_guide_token', token)
    .single()

  if (campaignError || !campaignData) {
    return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
  }

  const campaignId = campaignData.id

  // Fetch topics
  const { data: topicsData } = await supabase
    .from('topics')
    .select('id, name, category, captured')
    .eq('campaign_id', campaignId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  // Fetch sessions with AI topics
  const { data: sessionsData } = await supabase
    .from('sessions')
    .select('*')
    .eq('campaign_id', campaignId)
    .is('deleted_at', null)
    .order('session_number', { ascending: true })

  // Fetch collaborator responses that have been submitted
  const { data: tokensData } = await supabase
    .from('campaign_access_tokens')
    .select('id, name, role')
    .eq('campaign_id', campaignId)
    .eq('token_type', 'collaborator')
    .not('submitted_at', 'is', null)

  // Fetch actual responses for submitted tokens
  const { data: responsesData } = await supabase
    .from('collaborator_responses')
    .select('*')
    .eq('campaign_id', campaignId)

  // Map collaborator responses with their info
  const collaboratorInsights = (tokensData || [])
    .map(token => {
      const response = responsesData?.find(r => r.token_id === token.id)
      if (!response) return null

      return {
        name: token.name || 'Anonymous',
        role: roleLabels[token.role || ''] || token.role || 'Collaborator',
        what_they_ask_about: response.what_they_ask_about || [],
        what_will_be_hard: response.what_will_be_hard || undefined,
        wish_was_documented: response.wish_was_documented || undefined,
        specific_questions: response.specific_questions || [],
      }
    })
    .filter(Boolean)

  // Format sessions
  const sessions = (sessionsData || []).map(s => ({
    id: s.id,
    sessionNumber: s.session_number,
    title: s.title || undefined,
    scheduledAt: s.scheduled_at || '',
    durationMinutes: s.duration_minutes || 60,
    status: s.status || 'scheduled',
    topics: s.topics || [],
    aiSuggestedTopics: (s.ai_suggested_topics as SessionAiTopic[] | null) || [],
  }))

  // Format topics
  const topics = (topicsData || []).map(t => ({
    id: t.id,
    name: t.name,
    category: t.category,
    captured: t.captured ?? false,
  }))

  return NextResponse.json({
    campaign: {
      id: campaignData.id,
      expert_name: campaignData.expert_name,
      expert_role: campaignData.expert_role,
      goal: campaignData.goal || undefined,
      departure_date: campaignData.departure_date || undefined,
    },
    topics,
    sessions,
    selfAssessment: (campaignData.self_assessment as SelfAssessment) || null,
    collaboratorInsights,
  })
}
