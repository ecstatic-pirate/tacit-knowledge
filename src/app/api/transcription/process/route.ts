import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractTopicsFromTranscript } from '@/lib/openai'

interface TranscriptLine {
  speaker: string
  text: string
  timestampSeconds: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, transcriptLines } = body as {
      sessionId: string
      transcriptLines: TranscriptLine[]
    }

    if (!sessionId || !transcriptLines?.length) {
      return NextResponse.json({ error: 'sessionId and transcriptLines are required' }, { status: 400 })
    }

    // Get the session with campaign info and topics
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        campaign_id,
        campaigns (
          id,
          expert_name,
          self_assessment
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const campaign = session.campaigns as {
      id: string
      expert_name: string
      self_assessment: {
        topics_to_cover?: string[]
        what_you_know?: string[]
        questions_people_ask?: string[]
      } | null
    }

    // Combine topics to look for from self_assessment
    const selfAssessment = campaign.self_assessment || {}
    const topicsToLookFor = [
      ...(selfAssessment.topics_to_cover || []),
      ...(selfAssessment.what_you_know || []),
      ...(selfAssessment.questions_people_ask || []),
    ].filter(Boolean)

    if (topicsToLookFor.length === 0) {
      return NextResponse.json({
        message: 'No topics to track',
        topicsUpdated: [],
        newNodes: [],
      })
    }

    // Format transcript for AI processing
    const transcriptText = transcriptLines
      .map(line => `${line.speaker}: ${line.text}`)
      .join('\n')

    // Extract topics using AI
    const extraction = await extractTopicsFromTranscript(
      transcriptText,
      topicsToLookFor,
      campaign.expert_name
    )

    // Get existing graph nodes for this campaign
    const { data: existingNodes } = await supabase
      .from('graph_nodes')
      .select('id, label, coverage_status, metadata')
      .eq('campaign_id', campaign.id)
      .is('deleted_at', null)

    const existingNodeMap = new Map(
      (existingNodes || []).map(n => [n.label.toLowerCase(), n])
    )

    const topicsUpdated: string[] = []
    const newNodes: string[] = []

    // Update coverage status for mentioned topics
    for (const topic of extraction.topicsMentioned) {
      const existingNode = existingNodeMap.get(topic.topic.toLowerCase())

      if (existingNode) {
        // Update existing node coverage
        const newStatus = topic.confidence >= 0.7 ? 'covered' : 'mentioned'

        // Only update if we're increasing coverage (not_discussed -> mentioned -> covered)
        const shouldUpdate =
          existingNode.coverage_status === 'not_discussed' ||
          (existingNode.coverage_status === 'mentioned' && newStatus === 'covered')

        if (shouldUpdate) {
          await supabase
            .from('graph_nodes')
            .update({
              coverage_status: newStatus,
              session_id: sessionId,
              updated_at: new Date().toISOString(),
              metadata: {
                ...(typeof existingNode.metadata === 'object' && existingNode.metadata ? existingNode.metadata : {}),
                lastMentionContext: topic.context,
                lastMentionConfidence: topic.confidence,
              },
            })
            .eq('id', existingNode.id)

          topicsUpdated.push(topic.topic)
        }
      } else {
        // Create a new node for this topic
        const { data: newNode, error: insertError } = await supabase
          .from('graph_nodes')
          .insert({
            campaign_id: campaign.id,
            label: topic.topic,
            type: 'concept',
            coverage_status: topic.confidence >= 0.7 ? 'covered' : 'mentioned',
            session_id: sessionId,
            description: topic.context,
            metadata: {
              source: 'ai_detected',
              confidence: topic.confidence,
            },
          })
          .select()
          .single()

        if (!insertError && newNode) {
          newNodes.push(topic.topic)
        }
      }
    }

    // Create nodes for new entities found
    for (const entity of extraction.entitiesFound) {
      const existingEntity = existingNodeMap.get(entity.name.toLowerCase())

      if (!existingEntity) {
        const nodeType = entity.type === 'person' ? 'core' :
                        entity.type === 'system' || entity.type === 'tool' ? 'system' :
                        entity.type === 'process' ? 'process' : 'concept'

        await supabase
          .from('graph_nodes')
          .insert({
            campaign_id: campaign.id,
            label: entity.name,
            type: nodeType,
            coverage_status: 'mentioned',
            session_id: sessionId,
            metadata: {
              source: 'ai_detected',
              entityType: entity.type,
            },
          })

        newNodes.push(entity.name)
      }
    }

    return NextResponse.json({
      success: true,
      topicsUpdated,
      newNodes,
      suggestedFollowUp: extraction.suggestedFollowUp,
      extraction, // Full extraction for debugging
    })

  } catch (error) {
    console.error('Error processing transcript:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process transcript' },
      { status: 500 }
    )
  }
}
