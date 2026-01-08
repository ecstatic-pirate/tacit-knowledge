import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractSessionInsights } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Get session details with campaign
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        campaigns (
          id,
          expert_name
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const campaign = session.campaigns as { id: string; expert_name: string } | null

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get full transcript
    const { data: lines } = await supabase
      .from('transcript_lines')
      .select('speaker, text, timestamp_seconds')
      .eq('session_id', sessionId)
      .eq('is_final', true)
      .order('timestamp_seconds', { ascending: true })

    if (!lines || lines.length === 0) {
      return NextResponse.json({
        success: true,
        insights: [],
        message: 'No transcript available for analysis',
      })
    }

    // Format transcript
    const transcript = lines
      .map(l => `[${Math.floor(l.timestamp_seconds / 60)}:${(l.timestamp_seconds % 60).toString().padStart(2, '0')}] ${l.speaker}: ${l.text}`)
      .join('\n')

    // Extract insights from AI
    const insights = await extractSessionInsights(campaign.expert_name, transcript)

    // Save insights to database
    if (insights.length > 0) {
      const insightsToInsert = insights.map(insight => ({
        session_id: sessionId,
        campaign_id: campaign.id,
        title: insight.title,
        insight: insight.insight,
        confidence: insight.confidence,
      }))

      await supabase
        .from('captured_insights')
        .insert(insightsToInsert)
    }

    return NextResponse.json({
      success: true,
      insights,
      count: insights.length,
    })
  } catch (error) {
    console.error('Error extracting insights:', error)
    return NextResponse.json(
      { error: 'Failed to extract insights' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve existing insights
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const { data: insights, error } = await supabase
      .from('captured_insights')
      .select('*')
      .eq('session_id', sessionId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      insights: insights || [],
    })
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}
