import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInterviewPlan } from '@/lib/openai'
import type { Json, DocumentAnalysis } from '@/lib/supabase/database.types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = await request.json()

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get all processed documents for this campaign
    const { data: documents } = await supabase
      .from('documents')
      .select('filename, ai_analysis')
      .eq('campaign_id', campaignId)
      .eq('ai_processed', true)
      .is('deleted_at', null)

    // Prepare document summaries
    const documentSummaries = (documents || []).map(doc => {
      const analysis = doc.ai_analysis as DocumentAnalysis | null
      return {
        filename: doc.filename,
        summary: analysis?.summary || '',
        topics: analysis?.topics || [],
        gaps: analysis?.gaps || [],
      }
    })

    // Get self-assessment
    const selfAssessment = (campaign.self_assessment || {}) as {
      what_you_know?: string;
      questions_people_ask?: string[];
      what_will_break?: string;
      topics_to_cover?: string[];
    }

    // Generate interview plan
    const plan = await generateInterviewPlan(
      campaign.expert_name,
      campaign.expert_role,
      campaign.goal || 'Capture tacit knowledge before departure',
      documentSummaries,
      selfAssessment
    )

    // Save or update interview plan
    const { data: existingPlan } = await supabase
      .from('interview_plans')
      .select('id')
      .eq('campaign_id', campaignId)
      .single()

    if (existingPlan) {
      // Update existing plan
      await supabase
        .from('interview_plans')
        .update({
          questions: plan.questions as unknown as Json,
          gaps_identified: plan.gaps as unknown as Json,
          topics_covered: plan.topics as unknown as Json,
          context_summary: plan.contextSummary,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPlan.id)
    } else {
      // Create new plan
      await supabase
        .from('interview_plans')
        .insert({
          campaign_id: campaignId,
          questions: plan.questions as unknown as Json,
          gaps_identified: plan.gaps as unknown as Json,
          topics_covered: plan.topics as unknown as Json,
          context_summary: plan.contextSummary,
        })
    }

    return NextResponse.json({
      success: true,
      plan,
    })
  } catch (error) {
    console.error('Error generating interview plan:', error)
    return NextResponse.json(
      { error: 'Failed to generate interview plan' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve existing plan
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    const { data: plan, error } = await supabase
      .from('interview_plans')
      .select('*')
      .eq('campaign_id', campaignId)
      .single()

    if (error || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      plan: {
        questions: plan.questions,
        gaps: plan.gaps_identified,
        topics: plan.topics_covered,
        contextSummary: plan.context_summary,
      },
    })
  } catch (error) {
    console.error('Error fetching interview plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interview plan' },
      { status: 500 }
    )
  }
}
