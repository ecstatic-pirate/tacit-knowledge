import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, SelfAssessment, Json } from '@/lib/supabase/database.types'

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

// Validate self-assessment data
function validateSelfAssessment(data: unknown): SelfAssessment | null {
  if (!data || typeof data !== 'object') return null

  const assessment = data as Record<string, unknown>
  const result: SelfAssessment = {}

  // Validate what_you_know (string, max 10000 chars)
  if (typeof assessment.what_you_know === 'string') {
    result.what_you_know = escapeHtml(assessment.what_you_know.slice(0, 10000))
  }

  // Validate questions_people_ask (array of strings, max 50 items)
  if (Array.isArray(assessment.questions_people_ask)) {
    result.questions_people_ask = assessment.questions_people_ask
      .filter((q): q is string => typeof q === 'string')
      .slice(0, 50)
      .map(q => escapeHtml(q.slice(0, 500)))
  }

  // Validate what_will_break (string, max 10000 chars)
  if (typeof assessment.what_will_break === 'string') {
    result.what_will_break = escapeHtml(assessment.what_will_break.slice(0, 10000))
  }

  // Validate topics_to_cover (array of strings, max 50 items)
  if (Array.isArray(assessment.topics_to_cover)) {
    result.topics_to_cover = assessment.topics_to_cover
      .filter((t): t is string => typeof t === 'string')
      .slice(0, 50)
      .map(t => escapeHtml(t.slice(0, 500)))
  }

  // Validate doc_links (array of strings, max 20 items)
  if (Array.isArray(assessment.doc_links)) {
    result.doc_links = assessment.doc_links
      .filter((l): l is string => typeof l === 'string' && l.length < 2000)
      .slice(0, 20)
  }

  return result
}

// Create a Supabase client for public API access
// Note: Using anon key as service role key is not configured
// RLS policies handle security for these tables
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

  // Fetch token data
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
        self_assessment
      )
    `)
    .eq('token', token)
    .eq('token_type', 'expert')
    .single()

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
  }

  // Check if token is expired
  if (new Date(tokenData.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
  }

  return NextResponse.json({
    tokenId: tokenData.id,
    email: tokenData.email,
    name: tokenData.name,
    submittedAt: tokenData.submitted_at,
    draftData: tokenData.draft_data,
    campaign: tokenData.campaigns,
  })
}

// POST: Save draft or submit assessment
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
  const data = validateSelfAssessment(rawData)
  if (!data) {
    return NextResponse.json({ error: 'Invalid assessment data' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Verify token and get campaign ID
  const { data: tokenData, error: tokenError } = await supabase
    .from('campaign_access_tokens')
    .select('id, campaign_id, expires_at')
    .eq('token', token)
    .eq('token_type', 'expert')
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

  // If submitting, also update the campaign's self_assessment
  if (submit) {
    const { error: campaignError } = await supabase
      .from('campaigns')
      .update({ self_assessment: data as unknown as Json })
      .eq('id', tokenData.campaign_id)

    if (campaignError) {
      console.error('Error updating campaign:', campaignError)
      return NextResponse.json({ error: 'Failed to save assessment' }, { status: 500 })
    }

    // Create topics from topics_to_cover
    if (data.topics_to_cover && data.topics_to_cover.length > 0) {
      const topicsToInsert = data.topics_to_cover.map(topicName => ({
        campaign_id: tokenData.campaign_id,
        name: topicName,
        suggested_by: 'expert_self_assessment',
        captured: false,
      }))

      const { error: topicsError } = await supabase
        .from('topics')
        .insert(topicsToInsert)

      if (topicsError) {
        console.error('Error creating topics from self-assessment:', topicsError)
        // Don't fail the request, topics are supplementary
      }
    }
  }

  return NextResponse.json({
    success: true,
    submitted: submit ?? false,
  })
}
