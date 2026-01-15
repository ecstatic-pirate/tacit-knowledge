import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeDocumentsForCampaign, DocumentSuggestionResult } from '@/lib/openai'
import type { Json } from '@/lib/supabase/database.types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId, campaignType, contextInfo } = await request.json() as {
      campaignId: string
      campaignType: 'person' | 'project'
      contextInfo?: {
        expertName?: string
        expertRole?: string
        projectName?: string
        projectDescription?: string
      }
    }

    if (!campaignId || !campaignType) {
      return NextResponse.json(
        { error: 'Campaign ID and type are required' },
        { status: 400 }
      )
    }

    // Get all documents for this campaign
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, filename, extracted_text, file_type')
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)

    if (docsError) {
      console.error('Error fetching documents:', docsError)
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    if (!documents || documents.length === 0) {
      // Return empty suggestions if no documents
      const emptySuggestions: DocumentSuggestionResult = {
        suggestedDomains: [],
        suggestedTopics: [],
        suggestedFocusAreas: [],
        keyTopics: [],
        knowledgeGaps: ['No documents uploaded yet'],
        summary: 'Upload documents to receive AI-powered suggestions for knowledge capture.',
      }
      return NextResponse.json({
        success: true,
        suggestions: emptySuggestions,
        documentCount: 0,
      })
    }

    // Prepare document contents for analysis
    const documentContents: { filename: string; content: string }[] = []

    for (const doc of documents) {
      const content = doc.extracted_text

      // If no extracted text, skip the document
      if (!content) {
        // For now, skip documents without extracted text
        // In production, we'd extract text from the file here
        continue
      }

      documentContents.push({
        filename: doc.filename,
        content,
      })
    }

    if (documentContents.length === 0) {
      return NextResponse.json({
        success: true,
        suggestions: {
          suggestedDomains: [],
          suggestedTopics: [],
          suggestedFocusAreas: [],
          keyTopics: [],
          knowledgeGaps: ['Document content could not be extracted'],
          summary: 'Unable to analyze documents. Please ensure documents contain readable text.',
        },
        documentCount: documents.length,
      })
    }

    // Analyze documents with OpenAI
    const suggestions = await analyzeDocumentsForCampaign(
      documentContents,
      campaignType,
      contextInfo
    )

    // Save suggestions to campaign
    if (campaignType === 'person') {
      await supabase
        .from('campaigns')
        .update({ ai_suggested_domains: suggestions.suggestedDomains as unknown as Json })
        .eq('id', campaignId)
    } else {
      await supabase
        .from('campaigns')
        .update({ focus_areas: suggestions.suggestedFocusAreas as unknown as Json })
        .eq('id', campaignId)
    }

    return NextResponse.json({
      success: true,
      suggestions,
      documentCount: documentContents.length,
    })
  } catch (error) {
    console.error('Error analyzing campaign documents:', error)
    return NextResponse.json(
      { error: 'Failed to analyze documents' },
      { status: 500 }
    )
  }
}
