import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get a single schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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

    // Fetch the schedule
    // Note: Using 'as any' because report_schedules table types not yet generated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: schedule, error } = await (supabase as any)
      .from('report_schedules')
      .select(`
        *,
        campaigns (expert_name)
      `)
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .is('deleted_at', null)
      .single()

    if (error || !schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('Error in schedule API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}

// PATCH - Update a schedule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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

    // Verify schedule exists and belongs to user's org
    // Note: Using 'as any' because report_schedules table types not yet generated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingSchedule, error: scheduleError } = await (supabase as any)
      .from('report_schedules')
      .select('id, org_id')
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .is('deleted_at', null)
      .single()

    if (scheduleError || !existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const {
      name,
      triggerType,
      cronExpression,
      eventTrigger,
      enabled,
      recipients,
    } = body

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (triggerType !== undefined) updateData.trigger_type = triggerType
    if (cronExpression !== undefined) updateData.cron_expression = cronExpression
    if (eventTrigger !== undefined) updateData.event_trigger = eventTrigger
    if (enabled !== undefined) updateData.enabled = enabled
    if (recipients !== undefined) updateData.recipients = recipients

    // Update the schedule
    // Note: Using 'as any' because report_schedules table types not yet generated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: schedule, error } = await (supabase as any)
      .from('report_schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating schedule:', error)
      return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
    }

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('Error in schedule API:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete a schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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

    // Soft delete the schedule
    // Note: Using 'as any' because report_schedules table types not yet generated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('report_schedules')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', userData.org_id)

    if (error) {
      console.error('Error deleting schedule:', error)
      return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in schedule API:', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
}
