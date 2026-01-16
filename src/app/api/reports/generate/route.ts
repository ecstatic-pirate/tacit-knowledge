import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { templateType, campaignId, sessionId, scheduleId, timePeriod } = body

    if (!templateType) {
      return NextResponse.json({ error: 'templateType is required' }, { status: 400 })
    }

    // If campaignId is provided, verify user has access to it
    if (campaignId) {
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, org_id')
        .eq('id', campaignId)
        .eq('org_id', userData.org_id)
        .single()

      if (campaignError || !campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }
    }

    // If sessionId is provided, verify it belongs to an accessible campaign
    if (sessionId) {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          id,
          campaigns!inner (org_id)
        `)
        .eq('id', sessionId)
        .single()

      if (sessionError || !session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      const campaigns = session.campaigns as { org_id: string }
      if (campaigns.org_id !== userData.org_id) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
    }

    // Call the edge function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase configuration')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        templateType,
        campaignId,
        sessionId,
        scheduleId,
        orgId: userData.org_id,
        userId: user.id,
        timePeriod,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Edge function error:', errorData)
      return NextResponse.json(
        { error: errorData.error || 'Failed to generate report' },
        { status: response.status }
      )
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Error in generate-report API:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
