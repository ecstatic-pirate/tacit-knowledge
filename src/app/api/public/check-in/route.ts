import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

// Use service role client for public access
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient<Database>(supabaseUrl, supabaseKey)
}

// GET: Load check-in form data for a given token
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Look up the token
  const { data: tokenData, error: tokenError } = await supabase
    .from('campaign_access_tokens')
    .select('id, campaign_id, name, email, token_type, submitted_at, expires_at')
    .eq('token', token)
    .eq('token_type', 'check_in')
    .single()

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
  }

  // Check if already submitted
  if (tokenData.submitted_at) {
    return NextResponse.json({ error: 'This check-in has already been submitted' }, { status: 410 })
  }

  // Check if expired
  if (new Date(tokenData.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This check-in link has expired' }, { status: 410 })
  }

  // Fetch campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, expert_name, initiative_status')
    .eq('id', tokenData.campaign_id)
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      name: campaign.expert_name,
      initiativeStatus: campaign.initiative_status,
    },
    token: {
      id: tokenData.id,
      name: tokenData.name,
      email: tokenData.email,
    },
  })
}

// POST: Submit check-in responses
export async function POST(request: NextRequest) {
  let body: { token: string; responses: Record<string, string> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { token, responses } = body

  if (!token || !responses) {
    return NextResponse.json({ error: 'Token and responses are required' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Look up the token - must be check_in type, not submitted, and not expired
  const { data: tokenData, error: tokenError } = await supabase
    .from('campaign_access_tokens')
    .select('id, campaign_id')
    .eq('token', token)
    .eq('token_type', 'check_in')
    .is('submitted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: 'Check-in not found or already submitted' }, { status: 404 })
  }

  // Update the token with the responses and mark as submitted
  const { error: updateError } = await supabase
    .from('campaign_access_tokens')
    .update({
      draft_data: responses,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', tokenData.id)

  if (updateError) {
    console.error('Error updating check-in token:', updateError)
    return NextResponse.json({ error: 'Failed to submit check-in' }, { status: 500 })
  }

  // Update campaign's last_check_in timestamp
  const { error: campaignUpdateError } = await supabase
    .from('campaigns')
    .update({ last_check_in: new Date().toISOString() })
    .eq('id', tokenData.campaign_id)

  if (campaignUpdateError) {
    console.error('Error updating campaign last_check_in:', campaignUpdateError)
  }

  // Fetch campaign for the response + related initiatives
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('expert_name, tech_stack, business_unit, region, initiative_status')
    .eq('id', tokenData.campaign_id)
    .single()

  // Find related initiatives for post-check-in discovery
  let relatedInitiatives: Array<{ id: string; name: string; reason: string }> = []
  if (campaign) {
    const { data: allCampaigns } = await supabase
      .from('campaigns')
      .select('id, expert_name, tech_stack, business_unit, region, initiative_status')
      .is('deleted_at', null)
      .neq('id', tokenData.campaign_id)
      .limit(50)

    if (allCampaigns) {
      const scored = allCampaigns
        .map(c => {
          let score = 0
          const reasons: string[] = []
          const sharedTech = (campaign.tech_stack ?? []).filter((t: string) => (c.tech_stack ?? []).includes(t))
          if (sharedTech.length > 0) { score += sharedTech.length * 20; reasons.push(`Shared tech: ${sharedTech.join(', ')}`) }
          if (campaign.business_unit && c.business_unit === campaign.business_unit) { score += 15; reasons.push(`Same business unit`) }
          if (campaign.region && c.region === campaign.region) { score += 10; reasons.push(`Same region`) }
          return { id: c.id, name: c.expert_name, score, reason: reasons.join(' · ') }
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)

      relatedInitiatives = scored
    }
  }

  return NextResponse.json({
    success: true,
    campaignName: campaign?.expert_name || 'the initiative',
    relatedInitiatives,
  })
}
