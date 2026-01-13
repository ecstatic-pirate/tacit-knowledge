import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/client'
import { expertInvitationEmail, collaboratorInvitationEmail, contributorInvitationEmail } from '@/lib/email/templates'
import type { Json } from '@/lib/supabase/database.types'

interface Collaborator {
  name: string
  email: string
  role: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const campaignId = resolvedParams.id
  const supabase = await createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select(`
      *,
      organizations (name)
    `)
    .eq('id', campaignId)
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // Get base URL for form links
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  // Create tokens using the database function
  const collaborators = (campaign.collaborators as Collaborator[] | null) || []
  const { data: tokens, error: tokensError } = await supabase
    .rpc('create_campaign_tokens', {
      p_campaign_id: campaignId,
      p_expert_email: campaign.expert_email || '',
      p_expert_name: campaign.expert_name,
      p_collaborators: collaborators as unknown as Json,
    })

  if (tokensError || !tokens) {
    console.error('Error creating tokens:', tokensError)
    return NextResponse.json({ error: 'Failed to create access tokens' }, { status: 500 })
  }

  // Schedule reminders for each token
  for (const token of tokens) {
    await supabase.rpc('schedule_token_reminders', { p_token_id: token.id })
  }

  const emailResults: { type: string; email: string; success: boolean; error?: string }[] = []
  const orgName = (campaign.organizations as { name: string } | null)?.name

  // Send expert invitation (only for expert campaigns, not project campaigns)
  const expertToken = tokens.find(t => t.token_type === 'expert')
  if (expertToken && campaign.expert_email && campaign.subject_type !== 'project') {
    const assessmentUrl = `${baseUrl}/assess/${expertToken.token}`

    try {
      await sendEmail({
        to: campaign.expert_email,
        subject: `${orgName || 'Tacit Knowledge'}: Complete your self-assessment`,
        html: expertInvitationEmail({
          expertName: campaign.expert_name,
          expertRole: campaign.expert_role,
          organizationName: orgName,
          campaignGoal: campaign.goal || undefined,
          assessmentUrl,
          expiresInDays: 30,
        }),
      })
      emailResults.push({ type: 'expert', email: campaign.expert_email, success: true })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      emailResults.push({ type: 'expert', email: campaign.expert_email, success: false, error: errorMessage })
    }
  }

  // Check if this is a project campaign
  const isProjectCampaign = campaign.subject_type === 'project'

  if (isProjectCampaign) {
    // For project campaigns, send contributor invitations
    // Collaborators in project campaigns are treated as contributors
    const contributorTokens = tokens.filter(t => t.token_type === 'collaborator' || t.token_type === 'contributor')
    for (const token of contributorTokens) {
      const surveyUrl = `${baseUrl}/project-survey/${token.token}`

      try {
        await sendEmail({
          to: token.email,
          subject: `${orgName || 'Tacit Knowledge'}: Share your knowledge about ${campaign.expert_name}`,
          html: contributorInvitationEmail({
            contributorName: token.name || 'there',
            contributorRole: token.role || undefined,
            projectName: campaign.expert_name, // expert_name holds project name for project campaigns
            projectDescription: campaign.goal || undefined,
            organizationName: orgName,
            surveyUrl,
            expiresInDays: 30,
          }),
        })
        emailResults.push({ type: 'contributor', email: token.email, success: true })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        emailResults.push({ type: 'contributor', email: token.email, success: false, error: errorMessage })
      }
    }
  } else {
    // For expert campaigns, send collaborator invitations (original behavior)
    const collaboratorTokens = tokens.filter(t => t.token_type === 'collaborator')
    for (const token of collaboratorTokens) {
      const feedbackUrl = `${baseUrl}/feedback/${token.token}`

      try {
        await sendEmail({
          to: token.email,
          subject: `${orgName || 'Tacit Knowledge'}: Share your input about ${campaign.expert_name}`,
          html: collaboratorInvitationEmail({
            collaboratorName: token.name || 'there',
            collaboratorRole: token.role || 'collaborator',
            expertName: campaign.expert_name,
            expertRole: campaign.expert_role,
            organizationName: orgName,
            campaignGoal: campaign.goal || undefined,
            feedbackUrl,
            expiresInDays: 30,
          }),
        })
        emailResults.push({ type: 'collaborator', email: token.email, success: true })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        emailResults.push({ type: 'collaborator', email: token.email, success: false, error: errorMessage })
      }
    }
  }

  const successCount = emailResults.filter(r => r.success).length
  const failedCount = emailResults.filter(r => !r.success).length

  return NextResponse.json({
    success: true,
    tokensCreated: tokens.length,
    emailsSent: successCount,
    emailsFailed: failedCount,
    results: emailResults,
  })
}
