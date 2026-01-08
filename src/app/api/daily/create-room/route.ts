import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createRoom, createMeetingToken } from '@/lib/daily'

// GET: Fetch tokens for an existing room
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    // Get the session with room URL
    const { data: session, error: sessionError } = await supabase
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
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (!session.room_url) {
      return NextResponse.json({ error: 'Room not created yet' }, { status: 404 })
    }

    // Extract room name from URL
    const roomName = session.room_url.split('/').pop() || ''
    const expertName = (session.campaigns as { expert_name: string })?.expert_name || 'Expert'

    // Create new tokens
    const [interviewerToken, guestToken] = await Promise.all([
      createMeetingToken({
        roomName,
        userName: 'Interviewer',
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
      guestLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/interview/${sessionId}/guest?token=${guestToken.token}`,
    })

  } catch (error) {
    console.error('Error fetching room tokens:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tokens' },
      { status: 500 }
    )
  }
}

// POST: Create a new room or return existing
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    // Get the session with campaign info
    const { data: session, error: sessionError } = await supabase
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
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // If room already exists, return it
    if (session.room_url) {
      // Extract room name from URL
      const roomName = session.room_url.split('/').pop() || ''

      // Create new tokens for this session
      const [interviewerToken, guestToken] = await Promise.all([
        createMeetingToken({
          roomName,
          userName: 'Interviewer',
          isOwner: true,
          expirySeconds: 7200, // 2 hours
        }),
        createMeetingToken({
          roomName,
          userName: (session.campaigns as { expert_name: string })?.expert_name || 'Expert',
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
        guestLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/interview/${sessionId}/guest?token=${guestToken.token}`,
      })
    }

    // Create a new Daily.co room
    const room = await createRoom({
      name: `session-${sessionId.substring(0, 8)}`,
      expirySeconds: 7200, // 2 hours
      enableRecording: true,
      maxParticipants: 4, // Allow a bit more for flexibility
    })

    // Create meeting tokens
    const expertName = (session.campaigns as { expert_name: string })?.expert_name || 'Expert'

    const [interviewerToken, guestToken] = await Promise.all([
      createMeetingToken({
        roomName: room.name,
        userName: 'Interviewer',
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
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        room_url: room.url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Failed to save room URL:', updateError)
      // Don't fail - room is created, we can still use it
    }

    return NextResponse.json({
      roomUrl: room.url,
      roomName: room.name,
      interviewerToken: interviewerToken.token,
      guestToken: guestToken.token,
      interviewerLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/interview/${sessionId}/interviewer`,
      guestLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/interview/${sessionId}/guest?token=${guestToken.token}`,
    })

  } catch (error) {
    console.error('Error creating Daily room:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create room' },
      { status: 500 }
    )
  }
}
