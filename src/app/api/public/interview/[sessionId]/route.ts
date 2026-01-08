import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Use service role to bypass RLS for public interview access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Fetch session with campaign info (public data only)
    const { data: session, error } = await supabaseAdmin
      .from('sessions')
      .select(`
        id,
        campaign_id,
        session_number,
        room_url,
        status,
        campaigns (
          id,
          expert_name,
          goal
        )
      `)
      .eq('id', sessionId)
      .is('deleted_at', null)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Cast campaigns to single object (Supabase returns it as array type but it's a single relation)
    const campaign = session.campaigns as unknown as { expert_name: string; goal: string | null } | null

    // Only return non-sensitive data
    return NextResponse.json({
      id: session.id,
      campaignId: session.campaign_id,
      sessionNumber: session.session_number,
      roomUrl: session.room_url,
      status: session.status,
      expertName: campaign?.expert_name,
      goal: campaign?.goal,
    })
  } catch (err) {
    console.error('Error fetching interview session:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
