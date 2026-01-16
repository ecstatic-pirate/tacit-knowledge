import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all report templates
    // Note: Using 'as any' because report_templates table types not yet generated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: templates, error } = await (supabase as any)
      .from('report_templates')
      .select('type, name, description, requires_campaign, requires_session, estimated_tokens')
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error in templates API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}
