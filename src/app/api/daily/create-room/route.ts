import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRoom, createMeetingToken } from '@/lib/daily'

// Use service role to bypass RLS for public interview access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Fetch tokens for an existing room (public - no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    const interviewerName = searchParams.get('interviewerName') || 'Interviewer'

    // Get the session with room URL
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select(`
        id,
        room_url,
        campaign_id,
        campaigns (
          expert_name
        )
      `)
      .eq('id', sessionId)
      .is('deleted_at', null)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (!session.room_url) {
      return NextResponse.json({ error: 'Room not created yet' }, { status: 404 })
    }

    // Extract room name from URL
    const roomName = session.room_url.split('/').pop() || ''
    const campaign = session.campaigns as unknown as { expert_name: string } | null
    const expertName = campaign?.expert_name || 'Expert'

    // Create new tokens
    const [interviewerToken, guestToken] = await Promise.all([
      createMeetingToken({
        roomName,
        userName: interviewerName,
        isOwner: true,
        expirySeconds: 7200,
      }),
      createMeetingToken({
        roomName,
        userName: expertName,
        isOwner: false,
        expirySeconds: 7200,
      }),
    ])

    return NextResponse.json({
      roomUrl: session.room_url,
      roomName,
      interviewerToken: interviewerToken.token,
      guestToken: guestToken.token,
      interviewerLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/interview/${sessionId}/interviewer`,
      guestLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/interview/${sessionId}/guest`,
    })

  } catch (error) {
    console.error('Error fetching room tokens:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tokens' },
      { status: 500 }
    )
  }
}

// POST: Create a new room or return existing (public - no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, interviewerName = 'Interviewer' } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    // Get the session with campaign info
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select(`
        id,
        room_url,
        campaign_id,
        campaigns (
          expert_name,
          expert_email
        )
      `)
      .eq('id', sessionId)
      .is('deleted_at', null)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const campaign = session.campaigns as unknown as { expert_name: string } | null
    const expertName = campaign?.expert_name || 'Expert'

    // If room already exists, return it with fresh tokens
    if (session.room_url) {
      const roomName = session.room_url.split('/').pop() || ''

      const [interviewerToken, guestToken] = await Promise.all([
        createMeetingToken({
          roomName,
          userName: interviewerName,
          isOwner: true,
          expirySeconds: 7200,
        }),
        createMeetingToken({
          roomName,
          userName: expertName,
          isOwner: false,
          expirySeconds: 7200,
        }),
      ])

      return NextResponse.json({
        roomUrl: session.room_url,
        roomName,
        interviewerToken: interviewerToken.token,
        guestToken: guestToken.token,
        interviewerLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/interview/${sessionId}/interviewer`,
        guestLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/interview/${sessionId}/guest`,
      })
    }

    // Create a new Daily.co room
    const room = await createRoom({
      name: `session-${sessionId.substring(0, 8)}`,
      expirySeconds: 7200,
      enableRecording: true,
      maxParticipants: 4,
    })

    const [interviewerToken, guestToken] = await Promise.all([
      createMeetingToken({
        roomName: room.name,
        userName: interviewerName,
        isOwner: true,
        expirySeconds: 7200,
      }),
      createMeetingToken({
        roomName: room.name,
        userName: expertName,
        isOwner: false,
        expirySeconds: 7200,
      }),
    ])

    // Save room URL to session
    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({
        room_url: room.url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Failed to save room URL:', updateError)
    }

    return NextResponse.json({
      roomUrl: room.url,
      roomName: room.name,
      interviewerToken: interviewerToken.token,
      guestToken: guestToken.token,
      interviewerLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/interview/${sessionId}/interviewer`,
      guestLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/interview/${sessionId}/guest`,
    })

  } catch (error) {
    console.error('Error creating Daily room:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create room' },
      { status: 500 }
    )
  }
}
