import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/client'
import { checkInRequestEmail } from '@/lib/email/templates'
import { randomBytes } from 'crypto'

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
    .select('id, expert_name, expert_email, collaborators, initiative_status, organizations(name)')
    .eq('id', campaignId)
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const orgName = (campaign.organizations as { name: string } | null)?.name

  // Collect all recipients: expert + collaborators
  interface Recipient { name: string; email: string }
  const recipients: Recipient[] = []

  if (campaign.expert_email) {
    recipients.push({ name: campaign.expert_name, email: campaign.expert_email })
  }

  const collaborators = (campaign.collaborators as Array<{ name: string; email: string }> | null) || []
  for (const c of collaborators) {
    if (c.email && !recipients.some(r => r.email === c.email)) {
      recipients.push({ name: c.name, email: c.email })
    }
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
  }

  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days
  const sentTo: string[] = []

  for (const recipient of recipients) {
    const token = randomBytes(32).toString('hex')

    // Create check-in token
    const { error: insertError } = await supabase
      .from('campaign_access_tokens')
      .insert({
        campaign_id: campaignId,
        token,
        token_type: 'check_in',
        email: recipient.email,
        name: recipient.name,
        expires_at: expiresAt,
      })

    if (insertError) {
      console.error('Error creating check-in token:', insertError)
      continue
    }

    const checkInUrl = `${baseUrl}/check-in/${token}`

    // Send email
    try {
      await sendEmail({
        to: recipient.email,
        subject: `Check-in requested: ${campaign.expert_name}`,
        html: checkInRequestEmail({
          recipientName: recipient.name,
          campaignName: campaign.expert_name,
          organizationName: orgName || undefined,
          checkInUrl,
          expiresInDays: 14,
        }),
      })
      sentTo.push(recipient.email)
    } catch (err) {
      console.error(`Failed to send check-in email to ${recipient.email}:`, err)
    }
  }

  return NextResponse.json({
    success: true,
    emailsSent: sentTo.length,
    sentTo,
  })
}
