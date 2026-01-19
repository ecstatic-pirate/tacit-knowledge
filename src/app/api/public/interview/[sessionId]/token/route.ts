import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createMeetingToken, createRoom, getRoom } from '@/lib/daily'

// Use service role to bypass RLS for public interview access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Get guest or interviewer token for a session (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'guest'

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Fetch session with room URL
    const { data: session, error } = await supabaseAdmin
      .from('sessions')
      .select(`
        id,
        room_url,
        campaigns (
          expert_name
        )
      `)
      .eq('id', sessionId)
      .is('deleted_at', null)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const campaign = session.campaigns as unknown as { expert_name: string } | null
    const expertName = campaign?.expert_name || 'Expert'

    let roomUrl = session.room_url
    let roomName = roomUrl?.split('/').pop() || ''

    // If room URL exists, verify the room still exists in Daily.co
    if (roomUrl && roomName) {
      const existingRoom = await getRoom(roomName)
      if (!existingRoom) {
        console.log(`[Token API] Room ${roomName} expired, creating new room for session ${sessionId}`)
        roomUrl = null // Clear to trigger recreation
      }
    }

    // If no room URL or room expired, create a new room
    if (!roomUrl) {
      console.log(`[Token API] Creating new room for session ${sessionId}`)
      const room = await createRoom({
        name: `session-${sessionId.substring(0, 8)}`,
        enableRecording: true,
        maxParticipants: 4,
      })

      roomUrl = room.url
      roomName = room.name

      // Save new room URL to session
      const { error: updateError } = await supabaseAdmin
        .from('sessions')
        .update({
          room_url: roomUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)

      if (updateError) {
        console.error('[Token API] Failed to save room URL:', updateError)
      }
    }

    // Create token based on role
    const isInterviewer = role === 'interviewer'
    const token = await createMeetingToken({
      roomName,
      userName: isInterviewer ? 'Interviewer' : expertName,
      isOwner: isInterviewer,
      expirySeconds: 7200, // 2 hours
    })

    return NextResponse.json({
      roomUrl,
      token: token.token,
      role,
    })
  } catch (err) {
    console.error('Error getting interview token:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
