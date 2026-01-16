import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

// GET - Get share status for a report
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

    // Verify report belongs to user's org
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, org_id')
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .is('deleted_at', null)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Get active share token
    // Note: Using 'as any' because report_share_tokens table types not yet generated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tokenData } = await (supabase as any)
      .from('report_share_tokens')
      .select('token, access_count, created_at')
      .eq('report_id', id)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (tokenData) {
      return NextResponse.json({
        isShared: true,
        token: tokenData.token,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${tokenData.token}`,
        accessCount: tokenData.access_count || 0,
      })
    }

    return NextResponse.json({
      isShared: false,
      token: null,
      shareUrl: null,
      accessCount: 0,
    })
  } catch (error) {
    console.error('Error getting share status:', error)
    return NextResponse.json(
      { error: 'Failed to get share status' },
      { status: 500 }
    )
  }
}

// POST - Generate share token
export async function POST(
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

    // Verify report belongs to user's org
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, org_id')
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .is('deleted_at', null)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Check if there's already an active token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingToken } = await (supabase as any)
      .from('report_share_tokens')
      .select('token')
      .eq('report_id', id)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingToken) {
      return NextResponse.json({
        token: existingToken.token,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${existingToken.token}`,
      })
    }

    // Generate new token
    const token = randomBytes(24).toString('base64url')

    // Insert token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('report_share_tokens')
      .insert({
        report_id: id,
        token,
        created_by: user.id,
      })

    if (insertError) {
      console.error('Error creating share token:', insertError)
      return NextResponse.json(
        { error: 'Failed to create share token' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      token,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${token}`,
    })
  } catch (error) {
    console.error('Error creating share token:', error)
    return NextResponse.json(
      { error: 'Failed to create share token' },
      { status: 500 }
    )
  }
}

// DELETE - Revoke share token
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

    // Verify report belongs to user's org
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, org_id')
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .is('deleted_at', null)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Revoke all active tokens for this report
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: revokeError } = await (supabase as any)
      .from('report_share_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('report_id', id)
      .is('revoked_at', null)

    if (revokeError) {
      console.error('Error revoking share token:', revokeError)
      return NextResponse.json(
        { error: 'Failed to revoke share token' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking share token:', error)
    return NextResponse.json(
      { error: 'Failed to revoke share token' },
      { status: 500 }
    )
  }
}
