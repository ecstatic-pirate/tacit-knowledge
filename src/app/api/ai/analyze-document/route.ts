import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeDocument } from '@/lib/openai'
import type { Json } from '@/lib/supabase/database.types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    // Get document from database
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check if already processed
    if (doc.ai_processed && doc.ai_analysis) {
      return NextResponse.json({
        success: true,
        analysis: doc.ai_analysis,
        cached: true,
      })
    }

    // Get document content from storage
    let documentText = doc.extracted_text

    if (!documentText) {
      // Download and extract text from the file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(doc.storage_path)

      if (downloadError || !fileData) {
        return NextResponse.json({ error: 'Failed to download document' }, { status: 500 })
      }

      // For now, just handle text-based files
      // In production, you'd use pdf-parse for PDFs, mammoth for DOCX, etc.
      const fileType = doc.file_type?.toLowerCase()

      if (fileType === 'txt' || fileType === 'md' || fileType === 'markdown') {
        documentText = await fileData.text()
      } else if (fileType === 'json') {
        documentText = await fileData.text()
      } else {
        // For PDFs and other formats, we'd need to use a parsing library
        // For MVP, just return a placeholder
        documentText = `[Document: ${doc.filename}] - Binary file, content extraction not yet implemented for ${fileType} files.`
      }

      // Save extracted text
      await supabase
        .from('documents')
        .update({ extracted_text: documentText })
        .eq('id', documentId)
    }

    // Analyze with OpenAI
    const analysis = await analyzeDocument(documentText, doc.filename)

    // Save analysis results
    await supabase
      .from('documents')
      .update({
        ai_processed: true,
        ai_processed_at: new Date().toISOString(),
        ai_analysis: analysis as unknown as Json,
        extracted_skills: analysis.topics as Json,
      })
      .eq('id', documentId)

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    console.error('Error analyzing document:', error)
    return NextResponse.json(
      { error: 'Failed to analyze document' },
      { status: 500 }
    )
  }
}
