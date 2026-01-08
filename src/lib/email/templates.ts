import { emailDesign } from './client'

const { colors, fonts } = emailDesign

// HTML escape to prevent XSS in email templates
function escapeHtml(text: string | undefined | null): string {
  if (!text) return ''
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

// Base email wrapper
function emailWrapper(content: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tacit Knowledge</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: ${fonts.body}; color: ${colors.text}; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="width: 36px; height: 36px; background-color: ${colors.primary}; border-radius: 6px; text-align: center; vertical-align: middle;">
                    <span style="color: ${colors.background}; font-size: 18px; font-weight: bold;">T</span>
                  </td>
                  <td style="padding-left: 12px; font-size: 18px; font-weight: 600; color: ${colors.primary};">
                    Tacit Knowledge
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color: white; border-radius: 12px; border: 1px solid ${colors.border}; padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center; color: ${colors.muted}; font-size: 13px;">
              <p style="margin: 0;">Tacit Knowledge Capture Platform</p>
              <p style="margin: 8px 0 0 0;">Preserving expertise, one conversation at a time.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

// Expert invitation email
export function expertInvitationEmail(params: {
  expertName: string
  expertRole: string
  organizationName?: string
  campaignGoal?: string
  assessmentUrl: string
  expiresInDays: number
}) {
  const { expertName, expertRole, organizationName, campaignGoal, assessmentUrl, expiresInDays } = params

  // Escape all user-provided content
  const safeExpertName = escapeHtml(expertName)
  const safeExpertRole = escapeHtml(expertRole)
  const safeOrgName = escapeHtml(organizationName)
  const safeCampaignGoal = escapeHtml(campaignGoal)

  const content = `
    <h1 style="font-family: ${fonts.heading}; font-size: 28px; font-weight: 600; color: ${colors.primary}; margin: 0 0 24px 0;">
      Your expertise matters
    </h1>

    <p style="margin: 0 0 20px 0; font-size: 16px;">
      Hi ${safeExpertName},
    </p>

    <p style="margin: 0 0 20px 0; font-size: 16px;">
      ${safeOrgName ? `${safeOrgName} is` : "We're"} preparing to capture your knowledge as <strong>${safeExpertRole}</strong>.
      Before we begin, we'd like to understand your perspective on what's most important to document.
    </p>

    ${safeCampaignGoal ? `
    <div style="background-color: ${colors.background}; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid ${colors.accent};">
      <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: ${colors.muted}; text-transform: uppercase; letter-spacing: 0.5px;">
        Campaign Goal
      </p>
      <p style="margin: 0; font-size: 15px; color: ${colors.text};">
        ${safeCampaignGoal}
      </p>
    </div>
    ` : ''}

    <p style="margin: 0 0 24px 0; font-size: 16px;">
      Please complete the self-assessment to help us ask better questions and focus on what matters most.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0;">
      <tr>
        <td style="background-color: ${colors.primary}; border-radius: 8px;">
          <a href="${assessmentUrl}" target="_blank" style="display: inline-block; padding: 16px 32px; color: white; text-decoration: none; font-weight: 600; font-size: 16px;">
            Start Self-Assessment
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0 0; font-size: 14px; color: ${colors.muted};">
      This link expires in ${expiresInDays} days. You can save your progress and return later.
    </p>
  `

  return emailWrapper(content)
}

// Collaborator invitation email
export function collaboratorInvitationEmail(params: {
  collaboratorName: string
  collaboratorRole: string
  expertName: string
  expertRole: string
  organizationName?: string
  campaignGoal?: string
  feedbackUrl: string
  expiresInDays: number
}) {
  const { collaboratorName, collaboratorRole, expertName, expertRole, organizationName, campaignGoal, feedbackUrl, expiresInDays } = params

  // Escape all user-provided content
  const safeCollabName = escapeHtml(collaboratorName)
  const safeExpertName = escapeHtml(expertName)
  const safeExpertRole = escapeHtml(expertRole)
  const safeOrgName = escapeHtml(organizationName)
  const safeCampaignGoal = escapeHtml(campaignGoal)

  const roleDescriptions: Record<string, string> = {
    successor: 'as someone who may be taking over responsibilities',
    teammate: 'as a teammate',
    partner: 'as a partner',
    manager: 'as their manager',
    report: 'as someone they mentor',
  }

  const roleContext = roleDescriptions[collaboratorRole] || ''

  const content = `
    <h1 style="font-family: ${fonts.heading}; font-size: 28px; font-weight: 600; color: ${colors.primary}; margin: 0 0 24px 0;">
      Your perspective is valuable
    </h1>

    <p style="margin: 0 0 20px 0; font-size: 16px;">
      Hi ${safeCollabName},
    </p>

    <p style="margin: 0 0 20px 0; font-size: 16px;">
      ${safeOrgName ? `${safeOrgName} is` : "We're"} preparing to capture the expertise of
      <strong>${safeExpertName}</strong> (${safeExpertRole}). ${roleContext ? `${roleContext[0].toUpperCase()}${roleContext.slice(1)}, your` : 'Your'}
      input will help ensure we capture the knowledge that matters most.
    </p>

    ${safeCampaignGoal ? `
    <div style="background-color: ${colors.background}; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid ${colors.accent};">
      <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: ${colors.muted}; text-transform: uppercase; letter-spacing: 0.5px;">
        Campaign Goal
      </p>
      <p style="margin: 0; font-size: 15px; color: ${colors.text};">
        ${safeCampaignGoal}
      </p>
    </div>
    ` : ''}

    <p style="margin: 0 0 24px 0; font-size: 16px;">
      We'd love to hear what knowledge you find most valuable and what questions should be asked during the knowledge capture sessions.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0;">
      <tr>
        <td style="background-color: ${colors.primary}; border-radius: 8px;">
          <a href="${feedbackUrl}" target="_blank" style="display: inline-block; padding: 16px 32px; color: white; text-decoration: none; font-weight: 600; font-size: 16px;">
            Share Your Input
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0 0; font-size: 14px; color: ${colors.muted};">
      This link expires in ${expiresInDays} days. You can save your progress and return later.
    </p>
  `

  return emailWrapper(content)
}

// Reminder email for expert
export function expertReminderEmail(params: {
  expertName: string
  assessmentUrl: string
  daysRemaining: number
  reminderNumber: number
}) {
  const { expertName, assessmentUrl, daysRemaining, reminderNumber } = params

  const urgencyLevel = reminderNumber === 3 ? 'final' : reminderNumber === 2 ? 'second' : 'friendly'

  const urgencyMessages: Record<string, string> = {
    friendly: "Just a friendly reminder that we're still waiting for your self-assessment.",
    second: "We noticed you haven't completed your self-assessment yet. Your input is valuable!",
    final: "This is a final reminder. Your assessment link will expire soon.",
  }

  const content = `
    <h1 style="font-family: ${fonts.heading}; font-size: 28px; font-weight: 600; color: ${colors.primary}; margin: 0 0 24px 0;">
      ${urgencyLevel === 'final' ? 'Final Reminder' : 'Friendly Reminder'}
    </h1>

    <p style="margin: 0 0 20px 0; font-size: 16px;">
      Hi ${expertName},
    </p>

    <p style="margin: 0 0 20px 0; font-size: 16px;">
      ${urgencyMessages[urgencyLevel]}
    </p>

    <p style="margin: 0 0 24px 0; font-size: 16px;">
      Your self-reflection helps us prepare better questions and focus on what matters most during the knowledge capture sessions.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0;">
      <tr>
        <td style="background-color: ${colors.primary}; border-radius: 8px;">
          <a href="${assessmentUrl}" target="_blank" style="display: inline-block; padding: 16px 32px; color: white; text-decoration: none; font-weight: 600; font-size: 16px;">
            Complete Self-Assessment
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0 0; font-size: 14px; color: ${colors.muted};">
      ${daysRemaining <= 5
        ? `This link expires in ${daysRemaining} days.`
        : 'You can save your progress and return later.'}
    </p>
  `

  return emailWrapper(content)
}

// Reminder email for collaborator
export function collaboratorReminderEmail(params: {
  collaboratorName: string
  expertName: string
  feedbackUrl: string
  daysRemaining: number
  reminderNumber: number
}) {
  const { collaboratorName, expertName, feedbackUrl, daysRemaining, reminderNumber } = params

  const urgencyLevel = reminderNumber === 3 ? 'final' : reminderNumber === 2 ? 'second' : 'friendly'

  const content = `
    <h1 style="font-family: ${fonts.heading}; font-size: 28px; font-weight: 600; color: ${colors.primary}; margin: 0 0 24px 0;">
      ${urgencyLevel === 'final' ? 'Final Reminder' : 'Friendly Reminder'}
    </h1>

    <p style="margin: 0 0 20px 0; font-size: 16px;">
      Hi ${collaboratorName},
    </p>

    <p style="margin: 0 0 20px 0; font-size: 16px;">
      We're still hoping to hear your thoughts about ${expertName}'s expertise. Your perspective will help ensure we capture the knowledge that matters most.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0;">
      <tr>
        <td style="background-color: ${colors.primary}; border-radius: 8px;">
          <a href="${feedbackUrl}" target="_blank" style="display: inline-block; padding: 16px 32px; color: white; text-decoration: none; font-weight: 600; font-size: 16px;">
            Share Your Input
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0 0; font-size: 14px; color: ${colors.muted};">
      ${daysRemaining <= 5
        ? `This link expires in ${daysRemaining} days.`
        : 'You can save your progress and return later.'}
    </p>
  `

  return emailWrapper(content)
}
