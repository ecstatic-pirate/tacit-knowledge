import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/concierge/conversations/[id] - Get a conversation with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const conversationId = resolvedParams.id
  const supabase = await createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch conversation
  const { data: conversation, error: convError } = await supabase
    .from('concierge_conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (convError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Fetch messages
  const { data: messages, error: msgError } = await supabase
    .from('concierge_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (msgError) {
    console.error('Error fetching messages:', msgError)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }

  return NextResponse.json({ conversation, messages })
}

// PATCH /api/concierge/conversations/[id] - Update conversation (title)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const conversationId = resolvedParams.id
  const supabase = await createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse request body
  const body = await request.json()
  const { title } = body

  if (!title || typeof title !== 'string') {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  // Update conversation
  const { data: conversation, error } = await supabase
    .from('concierge_conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) {
    console.error('Error updating conversation:', error)
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 })
  }

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  return NextResponse.json({ conversation })
}

// DELETE /api/concierge/conversations/[id] - Soft delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const conversationId = resolvedParams.id
  const supabase = await createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Soft delete conversation
  const { error } = await supabase
    .from('concierge_conversations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
