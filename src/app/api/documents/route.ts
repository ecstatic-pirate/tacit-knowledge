import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId, filename, fileType, extractedText } = await request.json()

    if (!campaignId || !filename) {
      return NextResponse.json({ error: 'Campaign ID and filename are required' }, { status: 400 })
    }

    // Create document record (for demo documents, we store the content directly as extracted_text)
    const { data: document, error: createError } = await supabase
      .from('documents')
      .insert({
        campaign_id: campaignId,
        uploaded_by: user.id,
        filename,
        file_type: fileType || 'text/markdown',
        file_size: extractedText?.length || 0,
        storage_path: `demo/${campaignId}/${filename}`, // Virtual path for demo docs
        extracted_text: extractedText || null,
        ai_processed: true, // Mark as processed since we're providing the content
        ai_processed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating document:', createError)
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      document,
    })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
