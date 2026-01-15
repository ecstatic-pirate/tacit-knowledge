import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sessionInviteEmail, generateICSContent, generateCalendarLinks } from '@/lib/email'
import { Resend } from 'resend'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: sessionId } = await params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { scheduledAt, interviewerName, interviewerEmail } = body

    if (!scheduledAt) {
      return NextResponse.json({ error: 'scheduledAt is required' }, { status: 400 })
    }

    if (!interviewerEmail) {
      return NextResponse.json({ error: 'interviewerEmail is required' }, { status: 400 })
    }

    // Fetch the session with campaign details
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        campaigns (
          id,
          expert_name,
          expert_email,
          expert_role,
          goal,
          subject_type,
          interviewer_guide_token,
          organizations (name)
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const campaign = session.campaigns
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Update session with schedule info
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        scheduled_at: scheduledAt,
        status: 'scheduled',
        interviewer_name: interviewerName || null,
        interviewer_email: interviewerEmail,
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error updating session:', updateError)
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }

    const scheduledDate = new Date(scheduledAt)
    const sessionTitle = session.title || `Session ${session.session_number}`
    const durationMinutes = session.duration_minutes || 60
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Extract topic names and IDs from ai_suggested_topics
    let topicsWithQuestions: Array<{ topic: string; questions: string[] }> = []
    const topicIds: string[] = []

    if (session.ai_suggested_topics && typeof session.ai_suggested_topics === 'object') {
      const aiTopics = session.ai_suggested_topics as { topics?: Array<{ id: string | null; name: string }> }
      if (aiTopics.topics) {
        aiTopics.topics.forEach(t => {
          topicsWithQuestions.push({ topic: t.name, questions: [] })
          if (t.id) topicIds.push(t.id)
        })
      }
    }

    // Fetch questions for these topics
    if (topicIds.length > 0) {
      const { data: questions } = await supabase
        .from('questions')
        .select('text, topic_id')
        .in('topic_id', topicIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (questions) {
        // Build a map of topic_id -> question texts
        const questionsMap = new Map<string, string[]>()
        questions.forEach(q => {
          if (q.topic_id) {
            const existing = questionsMap.get(q.topic_id) || []
            existing.push(q.text)
            questionsMap.set(q.topic_id, existing)
          }
        })

        // Match questions to topics
        const aiTopics = session.ai_suggested_topics as { topics?: Array<{ id: string | null; name: string }> }
        if (aiTopics.topics) {
          topicsWithQuestions = aiTopics.topics.map(t => ({
            topic: t.name,
            questions: t.id ? questionsMap.get(t.id) || [] : [],
          }))
        }
      }
    }

    const topicNames = topicsWithQuestions.map(t => t.topic)

    // Generate calendar links for easy "Add to Calendar" buttons
    const calendarLinks = generateCalendarLinks({
      title: `Knowledge Capture: ${sessionTitle}`,
      description: `Knowledge capture session with ${campaign.expert_name}${campaign.expert_role ? ` (${campaign.expert_role})` : ''}\n\nTopics: ${topicNames.join(', ') || 'To be discussed'}`,
      startDate: scheduledDate,
      durationMinutes,
    })

    // Generate ICS content
    const icsContent = generateICSContent({
      title: `Knowledge Capture: ${sessionTitle}`,
      description: `Knowledge capture session with ${campaign.expert_name}${campaign.expert_role ? ` (${campaign.expert_role})` : ''}\n\nTopics: ${topicNames.join(', ') || 'To be discussed'}`,
      startDate: scheduledDate,
      durationMinutes,
      attendees: [
        { name: interviewerName || 'Interviewer', email: interviewerEmail },
        ...(campaign.expert_email ? [{ name: campaign.expert_name, email: campaign.expert_email }] : []),
      ],
    })

    // Send emails
    const emailResults = {
      interviewer: { sent: false, error: null as string | null },
      expert: { sent: false, error: null as string | null, skipped: false },
    }

    // Get guide URL for interviewer
    const guideUrl = campaign.interviewer_guide_token
      ? `${appUrl}/guide/${campaign.interviewer_guide_token}`
      : `${appUrl}/campaigns/${campaign.id}`

    // Send interviewer email
    try {
      const interviewerHtml = sessionInviteEmail({
        recipientName: interviewerName || 'Interviewer',
        recipientRole: 'interviewer',
        sessionTitle,
        sessionNumber: session.session_number,
        expertName: campaign.expert_name,
        expertRole: campaign.expert_role,
        scheduledAt: scheduledDate,
        durationMinutes,
        topicsWithQuestions,
        sessionUrl: guideUrl,
        organizationName: campaign.organizations?.name,
        calendarLinks,
      })

      // Use Resend directly to attach ICS file
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Tacit <onboarding@resend.dev>'

        await resend.emails.send({
          from: fromEmail,
          to: interviewerEmail,
          subject: `Session Scheduled: ${sessionTitle} with ${campaign.expert_name}`,
          html: interviewerHtml,
          attachments: [
            {
              filename: 'invite.ics',
              content: Buffer.from(icsContent).toString('base64'),
              contentType: 'text/calendar',
            },
          ],
        })
        emailResults.interviewer.sent = true
      } else {
        // Dev mode - log instead
        console.log('\n📧 [DEV MODE] Interviewer email would be sent:')
        console.log(`   To: ${interviewerEmail}`)
        console.log(`   Subject: Session Scheduled: ${sessionTitle}`)
        emailResults.interviewer.sent = true
      }
    } catch (err) {
      console.error('Error sending interviewer email:', err)
      emailResults.interviewer.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Send expert email if they have an email AND it's different from interviewer
    const shouldSendExpertEmail = campaign.expert_email &&
      campaign.expert_email.toLowerCase() !== interviewerEmail.toLowerCase()

    if (shouldSendExpertEmail) {
      try {
        const expertHtml = sessionInviteEmail({
          recipientName: campaign.expert_name,
          recipientRole: 'expert',
          sessionTitle,
          sessionNumber: session.session_number,
          expertName: campaign.expert_name,
          expertRole: campaign.expert_role,
          scheduledAt: scheduledDate,
          durationMinutes,
          topicsWithQuestions,
          sessionUrl: `${appUrl}/campaigns/${campaign.id}`,
          organizationName: campaign.organizations?.name,
          calendarLinks,
        })

        if (process.env.RESEND_API_KEY) {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const fromEmail = process.env.RESEND_FROM_EMAIL || 'Tacit <onboarding@resend.dev>'

          await resend.emails.send({
            from: fromEmail,
            to: campaign.expert_email!, // We've already verified this is not null above
            subject: `Your Knowledge Capture Session: ${sessionTitle}`,
            html: expertHtml,
            attachments: [
              {
                filename: 'invite.ics',
                content: Buffer.from(icsContent).toString('base64'),
                contentType: 'text/calendar',
              },
            ],
          })
          emailResults.expert.sent = true
        } else {
          console.log('\n📧 [DEV MODE] Expert email would be sent:')
          console.log(`   To: ${campaign.expert_email}`)
          console.log(`   Subject: Your Knowledge Capture Session: ${sessionTitle}`)
          emailResults.expert.sent = true
        }
      } catch (err) {
        console.error('Error sending expert email:', err)
        emailResults.expert.error = err instanceof Error ? err.message : 'Unknown error'
      }
    } else if (campaign.expert_email) {
      // Expert email was skipped because it matches interviewer email
      emailResults.expert.skipped = true
      console.log('Skipping expert email - same as interviewer:', interviewerEmail)
    }

    return NextResponse.json({
      success: true,
      sessionId,
      scheduledAt,
      emailResults,
    })
  } catch (error) {
    console.error('Error scheduling session:', error)
    return NextResponse.json(
      { error: 'Failed to schedule session' },
      { status: 500 }
    )
  }
}
