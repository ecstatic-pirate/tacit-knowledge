import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/client'
import { expertInvitationEmail, collaboratorInvitationEmail, contributorInvitationEmail } from '@/lib/email/templates'

interface SendInvitationBody {
  // For resending existing token
  tokenId?: string
  // For creating new token and sending
  email?: string
  name?: string
  role?: string
  type?: 'expert' | 'collaborator' | 'contributor'
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

  const body: SendInvitationBody = await request.json()

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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const orgName = (campaign.organizations as { name: string } | null)?.name
  const isProjectCampaign = campaign.subject_type === 'project'

  // Case 1: Resend existing token
  if (body.tokenId) {
    const { data: token, error: tokenError } = await supabase
      .from('campaign_access_tokens')
      .select('*')
      .eq('id', body.tokenId)
      .eq('campaign_id', campaignId)
      .single()

    if (tokenError || !token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    try {
      if (token.token_type === 'expert') {
        const assessmentUrl = `${baseUrl}/assess/${token.token}`
        await sendEmail({
          to: token.email,
          subject: `${orgName || 'Tacit Knowledge'}: Complete your self-assessment`,
          html: expertInvitationEmail({
            expertName: token.name || campaign.expert_name,
            expertRole: campaign.expert_role,
            organizationName: orgName,
            campaignGoal: campaign.goal || undefined,
            assessmentUrl,
            expiresInDays: Math.ceil((new Date(token.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          }),
        })
      } else if (token.token_type === 'collaborator') {
        if (isProjectCampaign) {
          const surveyUrl = `${baseUrl}/project-survey/${token.token}`
          await sendEmail({
            to: token.email,
            subject: `${orgName || 'Tacit Knowledge'}: Share your knowledge about ${campaign.expert_name}`,
            html: contributorInvitationEmail({
              contributorName: token.name || 'there',
              contributorRole: token.role || undefined,
              projectName: campaign.expert_name,
              projectDescription: campaign.goal || undefined,
              organizationName: orgName,
              surveyUrl,
              expiresInDays: Math.ceil((new Date(token.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            }),
          })
        } else {
          const feedbackUrl = `${baseUrl}/feedback/${token.token}`
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
              expiresInDays: Math.ceil((new Date(token.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            }),
          })
        }
      }

      return NextResponse.json({ success: true, message: 'Invitation sent' })
    } catch (err) {
      console.error('Error sending invitation:', err)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
  }

  // Case 2: Create new token and send email
  if (body.email && body.type) {
    const tokenType = body.type === 'expert' ? 'expert' : 'collaborator'
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Generate token
    const { data: newToken, error: tokenError } = await supabase
      .rpc('generate_secure_token')

    if (tokenError || !newToken) {
      console.error('Error generating token:', tokenError)
      return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
    }

    // Insert token
    const { data: insertedToken, error: insertError } = await supabase
      .from('campaign_access_tokens')
      .insert({
        campaign_id: campaignId,
        token: newToken,
        token_type: tokenType,
        email: body.email,
        name: body.name || null,
        role: body.role || null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting token:', insertError)
      return NextResponse.json({ error: 'Failed to create token' }, { status: 500 })
    }

    // Send email
    try {
      if (tokenType === 'expert') {
        const assessmentUrl = `${baseUrl}/assess/${newToken}`
        await sendEmail({
          to: body.email,
          subject: `${orgName || 'Tacit Knowledge'}: Complete your self-assessment`,
          html: expertInvitationEmail({
            expertName: body.name || campaign.expert_name,
            expertRole: campaign.expert_role,
            organizationName: orgName,
            campaignGoal: campaign.goal || undefined,
            assessmentUrl,
            expiresInDays: 30,
          }),
        })
      } else {
        if (isProjectCampaign) {
          const surveyUrl = `${baseUrl}/project-survey/${newToken}`
          await sendEmail({
            to: body.email,
            subject: `${orgName || 'Tacit Knowledge'}: Share your knowledge about ${campaign.expert_name}`,
            html: contributorInvitationEmail({
              contributorName: body.name || 'there',
              contributorRole: body.role || undefined,
              projectName: campaign.expert_name,
              projectDescription: campaign.goal || undefined,
              organizationName: orgName,
              surveyUrl,
              expiresInDays: 30,
            }),
          })
        } else {
          const feedbackUrl = `${baseUrl}/feedback/${newToken}`
          await sendEmail({
            to: body.email,
            subject: `${orgName || 'Tacit Knowledge'}: Share your input about ${campaign.expert_name}`,
            html: collaboratorInvitationEmail({
              collaboratorName: body.name || 'there',
              collaboratorRole: body.role || 'collaborator',
              expertName: campaign.expert_name,
              expertRole: campaign.expert_role,
              organizationName: orgName,
              campaignGoal: campaign.goal || undefined,
              feedbackUrl,
              expiresInDays: 30,
            }),
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Invitation sent',
        token: insertedToken
      })
    } catch (err) {
      console.error('Error sending invitation:', err)
      return NextResponse.json({ error: 'Token created but failed to send email' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
}
