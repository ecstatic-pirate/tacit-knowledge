import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, Json, ManagerSurveyData } from '@/lib/supabase/database.types'

// HTML escape to prevent XSS
function escapeHtml(text: string | undefined | null): string {
  if (!text) return ''
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

// Validate manager survey data
function validateSurveyData(data: unknown): ManagerSurveyData | null {
  if (!data || typeof data !== 'object') return null

  const survey = data as Record<string, unknown>
  const result: ManagerSurveyData = {}

  // Validate suggested_topics (array of topic objects, max 50 items)
  if (Array.isArray(survey.suggested_topics)) {
    result.suggested_topics = survey.suggested_topics
      .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
      .slice(0, 50)
      .map(t => ({
        name: escapeHtml(typeof t.name === 'string' ? t.name.slice(0, 200) : ''),
        category: typeof t.category === 'string' ? escapeHtml(t.category.slice(0, 100)) : undefined,
        priority: ['high', 'medium', 'low'].includes(t.priority as string)
          ? (t.priority as 'high' | 'medium' | 'low')
          : undefined,
        reason: typeof t.reason === 'string' ? escapeHtml(t.reason.slice(0, 500)) : undefined,
      }))
      .filter(t => t.name.length > 0)
  }

  // Validate team_context (string, max 5000 chars)
  if (typeof survey.team_context === 'string') {
    result.team_context = escapeHtml(survey.team_context.slice(0, 5000))
  }

  // Validate key_concerns (string, max 5000 chars)
  if (typeof survey.key_concerns === 'string') {
    result.key_concerns = escapeHtml(survey.key_concerns.slice(0, 5000))
  }

  // Validate additional_notes (string, max 5000 chars)
  if (typeof survey.additional_notes === 'string') {
    result.additional_notes = escapeHtml(survey.additional_notes.slice(0, 5000))
  }

  return result
}

// Create a Supabase client for public API access
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient<Database>(supabaseUrl, supabaseKey)
}

// GET: Validate token and fetch existing data
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Fetch token data with campaign info
  const { data: tokenData, error: tokenError } = await supabase
    .from('campaign_access_tokens')
    .select(`
      *,
      campaigns (
        id,
        expert_name,
        expert_role,
        department,
        goal,
        subject_type,
        project_type
      )
    `)
    .eq('token', token)
    .eq('token_type', 'manager')
    .single()

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
  }

  // Check if token is expired
  if (new Date(tokenData.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
  }

  // Fetch existing topics for context
  const { data: existingTopics } = await supabase
    .from('topics')
    .select('id, name, category, suggested_by')
    .eq('campaign_id', tokenData.campaign_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  return NextResponse.json({
    tokenId: tokenData.id,
    campaignId: tokenData.campaign_id,
    managerEmail: tokenData.email,
    managerName: tokenData.name,
    submittedAt: tokenData.submitted_at,
    draftData: tokenData.draft_data,
    campaign: tokenData.campaigns,
    existingTopics: existingTopics || [],
  })
}

// POST: Save draft or submit manager suggestions
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { token, data: rawData, submit } = body as {
    token: string
    data: unknown
    submit?: boolean
  }

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  // Validate and sanitize input data
  const data = validateSurveyData(rawData)
  if (!data) {
    return NextResponse.json({ error: 'Invalid survey data' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Verify token and get info
  const { data: tokenData, error: tokenError } = await supabase
    .from('campaign_access_tokens')
    .select('id, campaign_id, email, name, role, expires_at')
    .eq('token', token)
    .eq('token_type', 'manager')
    .single()

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
  }

  // Update the token with draft data
  const tokenUpdate: { draft_data: Json; submitted_at?: string } = {
    draft_data: data as unknown as Json,
  }

  if (submit) {
    tokenUpdate.submitted_at = new Date().toISOString()
  }

  const { error: updateTokenError } = await supabase
    .from('campaign_access_tokens')
    .update(tokenUpdate)
    .eq('id', tokenData.id)

  if (updateTokenError) {
    console.error('Error updating token:', updateTokenError)
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
  }

  // If submitting, create topics from the manager's suggestions
  if (submit && data.suggested_topics && data.suggested_topics.length > 0) {
    const topicsToInsert = data.suggested_topics.map(topic => ({
      campaign_id: tokenData.campaign_id,
      name: topic.name,
      category: topic.category || null,
      suggested_by: 'manager',
      source: 'manager_survey',
    }))

    const { error: insertTopicsError } = await supabase
      .from('topics')
      .insert(topicsToInsert)

    if (insertTopicsError) {
      console.error('Error inserting topics:', insertTopicsError)
      // Don't fail the request, just log the error - topics insertion is supplementary
    }
  }

  return NextResponse.json({
    success: true,
    submitted: submit ?? false,
    topicsCreated: submit ? (data.suggested_topics?.length || 0) : 0,
  })
}
