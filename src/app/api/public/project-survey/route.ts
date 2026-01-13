import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/database.types'

// Project survey data structure
interface ProjectSurveyData {
  responsibilities?: string
  undocumented_knowledge?: string
  critical_knowledge?: string
  questions_for_team?: string[]
  additional_context?: string
}

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

// Validate project survey data
function validateSurveyData(data: unknown): ProjectSurveyData | null {
  if (!data || typeof data !== 'object') return null

  const survey = data as Record<string, unknown>
  const result: ProjectSurveyData = {}

  // Validate responsibilities (string, max 10000 chars)
  if (typeof survey.responsibilities === 'string') {
    result.responsibilities = escapeHtml(survey.responsibilities.slice(0, 10000))
  }

  // Validate undocumented_knowledge (string, max 10000 chars)
  if (typeof survey.undocumented_knowledge === 'string') {
    result.undocumented_knowledge = escapeHtml(survey.undocumented_knowledge.slice(0, 10000))
  }

  // Validate critical_knowledge (string, max 10000 chars)
  if (typeof survey.critical_knowledge === 'string') {
    result.critical_knowledge = escapeHtml(survey.critical_knowledge.slice(0, 10000))
  }

  // Validate questions_for_team (array of strings, max 50 items)
  if (Array.isArray(survey.questions_for_team)) {
    result.questions_for_team = survey.questions_for_team
      .filter((q): q is string => typeof q === 'string')
      .slice(0, 50)
      .map(q => escapeHtml(q.slice(0, 500)))
  }

  // Validate additional_context (string, max 5000 chars)
  if (typeof survey.additional_context === 'string') {
    result.additional_context = escapeHtml(survey.additional_context.slice(0, 5000))
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

  // Fetch token data with campaign info - using 'contributor' token type for project surveys
  const { data: tokenData, error: tokenError } = await supabase
    .from('campaign_access_tokens')
    .select(`
      *,
      campaigns (
        id,
        expert_name,
        expert_role,
        goal,
        subject_type
      )
    `)
    .eq('token', token)
    .eq('token_type', 'contributor')
    .single()

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
  }

  // Check if token is expired
  if (new Date(tokenData.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
  }

  // Check for existing response in collaborator_responses (reusing the table for project contributors)
  const { data: existingResponse } = await supabase
    .from('collaborator_responses')
    .select('*')
    .eq('token_id', tokenData.id)
    .single()

  return NextResponse.json({
    tokenId: tokenData.id,
    campaignId: tokenData.campaign_id,
    contributorEmail: tokenData.email,
    contributorName: tokenData.name,
    contributorRole: tokenData.role,
    submittedAt: tokenData.submitted_at,
    draftData: tokenData.draft_data,
    existingResponse: existingResponse ? {
      responsibilities: existingResponse.what_will_be_hard, // Map fields
      undocumented_knowledge: existingResponse.wish_was_documented,
      critical_knowledge: existingResponse.additional_notes,
      questions_for_team: existingResponse.specific_questions,
      additional_context: existingResponse.what_they_ask_about?.join('\n'),
    } : null,
    campaign: tokenData.campaigns,
  })
}

// POST: Save draft or submit survey
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
    .eq('token_type', 'contributor')
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

  // If submitting, upsert the response
  // We reuse collaborator_responses table but map fields differently for project surveys
  if (submit) {
    // Check for existing response
    const { data: existingResponse } = await supabase
      .from('collaborator_responses')
      .select('id')
      .eq('token_id', tokenData.id)
      .single()

    // Map project survey fields to collaborator_responses fields
    const responseData = {
      campaign_id: tokenData.campaign_id,
      token_id: tokenData.id,
      collaborator_email: tokenData.email,
      collaborator_name: tokenData.name || 'Unknown',
      collaborator_role: tokenData.role || 'contributor',
      // Map project survey fields to existing columns
      what_they_ask_about: data.additional_context ? [data.additional_context] : [],
      what_will_be_hard: data.responsibilities || null,
      wish_was_documented: data.undocumented_knowledge || null,
      specific_questions: data.questions_for_team || [],
      additional_notes: data.critical_knowledge || null,
      submitted_at: new Date().toISOString(),
    }

    if (existingResponse) {
      const { error: updateError } = await supabase
        .from('collaborator_responses')
        .update(responseData)
        .eq('id', existingResponse.id)

      if (updateError) {
        console.error('Error updating response:', updateError)
        return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
      }
    } else {
      const { error: insertError } = await supabase
        .from('collaborator_responses')
        .insert(responseData)

      if (insertError) {
        console.error('Error inserting response:', insertError)
        return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({
    success: true,
    submitted: submit ?? false,
  })
}
