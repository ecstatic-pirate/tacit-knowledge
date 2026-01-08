import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createMeetingToken } from '@/lib/daily'

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

    if (!session.room_url) {
      return NextResponse.json({ error: 'Interview has not started yet' }, { status: 404 })
    }

    // Extract room name from URL
    const roomName = session.room_url.split('/').pop() || ''
    const campaign = session.campaigns as unknown as { expert_name: string } | null
    const expertName = campaign?.expert_name || 'Expert'

    // Create token based on role
    const isInterviewer = role === 'interviewer'
    const token = await createMeetingToken({
      roomName,
      userName: isInterviewer ? 'Interviewer' : expertName,
      isOwner: isInterviewer,
      expirySeconds: 7200, // 2 hours
    })

    return NextResponse.json({
      roomUrl: session.room_url,
      token: token.token,
      role,
    })
  } catch (err) {
    console.error('Error getting interview token:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
