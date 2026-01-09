import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/concierge/conversations - List all conversations for the user
export async function GET() {
  const supabase = await createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch conversations
  const { data: conversations, error } = await supabase
    .from('concierge_conversations')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }

  return NextResponse.json({ conversations })
}

// POST /api/concierge/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org_id
  const { data: appUser, error: userError } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (userError || !appUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Parse request body
  let title = 'New Conversation'
  try {
    const body = await request.json()
    if (body.title) {
      title = body.title
    }
  } catch {
    // Use default title
  }

  // Create conversation
  const { data: conversation, error } = await supabase
    .from('concierge_conversations')
    .insert({
      user_id: user.id,
      org_id: appUser.org_id,
      title,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }

  return NextResponse.json({ conversation }, { status: 201 })
}
