import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List all schedules for user's org
export async function GET(request: NextRequest) {
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

    // Optional campaign filter
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    // Fetch schedules
    // Note: Using 'as any' because report_schedules table types not yet generated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('report_schedules')
      .select(`
        id,
        campaign_id,
        template_type,
        name,
        trigger_type,
        cron_expression,
        event_trigger,
        enabled,
        recipients,
        next_run_at,
        last_run_at,
        run_count,
        created_at,
        updated_at,
        campaigns (expert_name)
      `)
      .eq('org_id', userData.org_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    const { data: schedules, error } = await query

    if (error) {
      console.error('Error fetching schedules:', error)
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
    }

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error('Error in schedules API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

// POST - Create a new schedule
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
    const {
      campaignId,
      templateType,
      name,
      triggerType,
      cronExpression,
      eventTrigger,
      enabled = true,
      recipients = [],
    } = body

    // Validate required fields
    if (!templateType || !name || !triggerType) {
      return NextResponse.json(
        { error: 'templateType, name, and triggerType are required' },
        { status: 400 }
      )
    }

    // Validate trigger type
    if (!['cron', 'event', 'manual'].includes(triggerType)) {
      return NextResponse.json(
        { error: 'triggerType must be cron, event, or manual' },
        { status: 400 }
      )
    }

    // If campaign is specified, verify access
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

    // Create the schedule
    // Note: Using 'as any' because report_schedules table types not yet generated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: schedule, error } = await (supabase as any)
      .from('report_schedules')
      .insert({
        org_id: userData.org_id,
        campaign_id: campaignId || null,
        template_type: templateType,
        name,
        trigger_type: triggerType,
        cron_expression: cronExpression || null,
        event_trigger: eventTrigger || null,
        enabled,
        recipients,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating schedule:', error)
      return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
    }

    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    console.error('Error in schedules API:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}
