import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionGuidance } from '@/lib/openai'

// Type for questions in interview_plans JSON field
interface InterviewQuestion {
  question: string
  priority: 'high' | 'medium' | 'low'
  topic?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, recentTranscript, focusTopic } = await request.json()

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
          expert_name,
          goal
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const campaign = session.campaigns as { id: string; expert_name: string; goal: string | null } | null

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get interview plan
    const { data: plan } = await supabase
      .from('interview_plans')
      .select('questions, topics_covered')
      .eq('campaign_id', campaign.id)
      .single()

    // Get recent transcript if not provided
    let transcript = recentTranscript
    if (!transcript) {
      const { data: lines } = await supabase
        .from('transcript_lines')
        .select('speaker, text, timestamp_seconds')
        .eq('session_id', sessionId)
        .order('timestamp_seconds', { ascending: false })
        .limit(50)

      if (lines && lines.length > 0) {
        transcript = lines
          .reverse()
          .map(l => `${l.speaker}: ${l.text}`)
          .join('\n')
      }
    }

    // Extract planned questions that haven't been covered
    const plannedQuestions = ((plan?.questions as unknown as InterviewQuestion[]) || [])
      .filter(q => q.priority === 'high' || q.priority === 'medium')
      .map(q => q.question)

    // Get guidance from AI
    const guidance = await getSessionGuidance(
      campaign.expert_name,
      campaign.goal || 'Capture tacit knowledge',
      plannedQuestions,
      session.topics || [],
      transcript || '',
      focusTopic
    )

    return NextResponse.json({
      success: true,
      guidance,
      context: {
        expertName: campaign.expert_name,
        sessionNumber: session.session_number,
        capturedTopicsCount: (session.topics || []).length,
        remainingTopicsCount: plannedQuestions.length,
      },
    })
  } catch (error) {
    console.error('Error getting session guidance:', error)
    return NextResponse.json(
      { error: 'Failed to get session guidance' },
      { status: 500 }
    )
  }
}
