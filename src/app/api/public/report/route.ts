import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

// Create a Supabase service client for public API access
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient<Database>(supabaseUrl, supabaseKey)
}

// GET: Fetch report by share token
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Find the share token
    // Note: Using 'as any' because report_share_tokens table types not yet generated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tokenData, error: tokenError } = await (supabase as any)
      .from('report_share_tokens')
      .select('id, report_id, expires_at, revoked_at, access_count')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Invalid share link' }, { status: 404 })
    }

    // Check if token is revoked
    if (tokenData.revoked_at) {
      return NextResponse.json({ error: 'This share link has been revoked' }, { status: 404 })
    }

    // Check if token is expired
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
    }

    // Fetch the report
    // Note: Using 'as any' because reports table has new columns not yet in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: report, error: reportError } = await (supabase as any)
      .from('reports')
      .select(`
        id,
        title,
        type,
        template_type,
        status,
        preview,
        content_markdown,
        content_html,
        campaign_id,
        session_id,
        generated_at,
        generation_duration_ms,
        generation_error,
        created_at,
        metadata,
        campaigns (expert_name),
        sessions (session_number)
      `)
      .eq('id', tokenData.report_id)
      .is('deleted_at', null)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Update access count and last accessed timestamp
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('report_share_tokens')
      .update({
        access_count: (tokenData.access_count || 0) + 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', tokenData.id)

    // Map to Report type
    const campaign = report.campaigns as { expert_name: string } | null
    const session = report.sessions as { session_number: number } | null

    return NextResponse.json({
      report: {
        id: report.id,
        title: report.title,
        type: report.type,
        templateType: report.template_type,
        status: report.status,
        preview: report.preview,
        contentMarkdown: report.content_markdown,
        contentHtml: report.content_html,
        campaignId: report.campaign_id,
        sessionId: report.session_id,
        generatedAt: report.generated_at,
        generationDurationMs: report.generation_duration_ms,
        generationError: report.generation_error,
        createdAt: report.created_at,
        metadata: report.metadata,
        campaignName: campaign?.expert_name,
        sessionNumber: session?.session_number,
      },
    })
  } catch (error) {
    console.error('Error fetching public report:', error)
    return NextResponse.json(
      { error: 'Failed to load report' },
      { status: 500 }
    )
  }
}
