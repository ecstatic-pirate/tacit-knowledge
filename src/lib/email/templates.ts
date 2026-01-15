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

// Project contributor invitation email
export function contributorInvitationEmail(params: {
  contributorName: string
  contributorRole?: string
  projectName: string
  projectDescription?: string
  organizationName?: string
  surveyUrl: string
  expiresInDays: number
}) {
  const { contributorName, contributorRole, projectName, projectDescription, organizationName, surveyUrl, expiresInDays } = params

  // Escape all user-provided content
  const safeContribName = escapeHtml(contributorName)
  const safeProjectName = escapeHtml(projectName)
  const safeProjectDesc = escapeHtml(projectDescription)
  const safeOrgName = escapeHtml(organizationName)
  const safeRole = escapeHtml(contributorRole)

  const content = `
    <h1 style="font-family: ${fonts.heading}; font-size: 28px; font-weight: 600; color: ${colors.primary}; margin: 0 0 24px 0;">
      Help us capture project knowledge
    </h1>

    <p style="margin: 0 0 20px 0; font-size: 16px;">
      Hi ${safeContribName},
    </p>

    <p style="margin: 0 0 20px 0; font-size: 16px;">
      ${safeOrgName ? `${safeOrgName} is` : "We're"} working to document the knowledge behind
      <strong>${safeProjectName}</strong>${safeRole ? ` and you've been identified as a key contributor (${safeRole})` : ''}.
      Your insights will help ensure critical knowledge is preserved.
    </p>

    ${safeProjectDesc ? `
    <div style="background-color: ${colors.background}; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid ${colors.accent};">
      <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: ${colors.muted}; text-transform: uppercase; letter-spacing: 0.5px;">
        About the Project
      </p>
      <p style="margin: 0; font-size: 15px; color: ${colors.text};">
        ${safeProjectDesc}
      </p>
    </div>
    ` : ''}

    <p style="margin: 0 0 24px 0; font-size: 16px;">
      Please take a few minutes to share what you know about this project. Your input will help guide knowledge capture sessions and identify what's most important to document.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0;">
      <tr>
        <td style="background-color: ${colors.primary}; border-radius: 8px;">
          <a href="${surveyUrl}" target="_blank" style="display: inline-block; padding: 16px 32px; color: white; text-decoration: none; font-weight: 600; font-size: 16px;">
            Share Your Knowledge
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

// Session invite email with ICS calendar attachment
export function sessionInviteEmail(params: {
  recipientName: string
  recipientRole: 'expert' | 'interviewer'
  sessionTitle: string
  sessionNumber: number
  expertName: string
  expertRole?: string
  scheduledAt: Date
  durationMinutes: number
  topicsWithQuestions: Array<{ topic: string; questions: string[] }>
  sessionUrl: string
  organizationName?: string
  calendarLinks?: { google: string; outlook: string; office365: string }
}) {
  const {
    recipientName,
    recipientRole,
    sessionTitle,
    sessionNumber,
    expertName,
    expertRole,
    scheduledAt,
    durationMinutes,
    topicsWithQuestions,
    sessionUrl,
    organizationName,
    calendarLinks,
  } = params

  // Escape all user-provided content
  const safeRecipientName = escapeHtml(recipientName)
  const safeSessionTitle = escapeHtml(sessionTitle)
  const safeExpertName = escapeHtml(expertName)
  const safeExpertRole = escapeHtml(expertRole)
  const safeOrgName = escapeHtml(organizationName)

  const formattedDate = scheduledAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = scheduledAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const isExpert = recipientRole === 'expert'
  const headline = isExpert
    ? 'Your knowledge capture session is scheduled'
    : 'You have a knowledge capture session scheduled'

  const intro = isExpert
    ? `We've scheduled a knowledge capture session to document your expertise${safeExpertRole ? ` as ${safeExpertRole}` : ''}.`
    : `You're scheduled to conduct a knowledge capture session with <strong>${safeExpertName}</strong>${safeExpertRole ? ` (${safeExpertRole})` : ''}.`

  // Build topics and questions HTML
  const topicsHtml = topicsWithQuestions.length > 0 ? `
    <div style="margin-top: 24px;">
      <h3 style="font-family: ${fonts.heading}; font-size: 16px; font-weight: 600; color: ${colors.primary}; margin: 0 0 16px 0;">
        Topics & Questions to Cover
      </h3>
      ${topicsWithQuestions.map(({ topic, questions }) => `
        <div style="margin-bottom: 16px; padding: 16px; background-color: white; border-radius: 8px; border: 1px solid ${colors.border};">
          <div style="font-weight: 600; color: ${colors.text}; margin-bottom: 8px;">
            ${escapeHtml(topic)}
          </div>
          ${questions.length > 0 ? `
            <ul style="margin: 0; padding-left: 20px; color: ${colors.muted};">
              ${questions.map(q => `<li style="margin-bottom: 4px; font-size: 14px;">${escapeHtml(q)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  ` : ''

  const content = `
    <h1 style="font-family: ${fonts.heading}; font-size: 28px; font-weight: 600; color: ${colors.primary}; margin: 0 0 24px 0;">
      ${headline}
    </h1>

    <p style="margin: 0 0 20px 0; font-size: 16px;">
      Hi ${safeRecipientName},
    </p>

    <p style="margin: 0 0 24px 0; font-size: 16px;">
      ${intro}
    </p>

    <div style="background-color: ${colors.background}; border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px solid ${colors.border};">
      <h2 style="font-family: ${fonts.heading}; font-size: 18px; font-weight: 600; color: ${colors.primary}; margin: 0 0 16px 0;">
        Session ${sessionNumber}: ${safeSessionTitle}
      </h2>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 100px;">
            <span style="font-size: 13px; font-weight: 600; color: ${colors.muted};">DATE</span>
          </td>
          <td style="padding: 8px 0; font-size: 15px; color: ${colors.text};">
            ${formattedDate}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top;">
            <span style="font-size: 13px; font-weight: 600; color: ${colors.muted};">TIME</span>
          </td>
          <td style="padding: 8px 0; font-size: 15px; color: ${colors.text};">
            ${formattedTime} (${durationMinutes} minutes)
          </td>
        </tr>
      </table>

      ${topicsHtml}
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0;">
      <tr>
        <td style="background-color: ${colors.primary}; border-radius: 8px;">
          <a href="${sessionUrl}" target="_blank" style="display: inline-block; padding: 16px 32px; color: white; text-decoration: none; font-weight: 600; font-size: 16px;">
            ${isExpert ? 'View Session Details' : 'Open Session Guide'}
          </a>
        </td>
      </tr>
    </table>

    ${calendarLinks ? `
    <div style="margin: 24px 0 0 0; padding-top: 20px; border-top: 1px solid ${colors.border};">
      <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: ${colors.text};">
        Add to your calendar:
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding-right: 8px;">
            <a href="${calendarLinks.google}" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: #4285f4; color: white; text-decoration: none; font-size: 13px; font-weight: 500; border-radius: 4px;">
              Google
            </a>
          </td>
          <td style="padding-right: 8px;">
            <a href="${calendarLinks.office365}" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: #0078d4; color: white; text-decoration: none; font-size: 13px; font-weight: 500; border-radius: 4px;">
              Outlook
            </a>
          </td>
          <td>
            <a href="${calendarLinks.outlook}" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: #6c757d; color: white; text-decoration: none; font-size: 13px; font-weight: 500; border-radius: 4px;">
              Outlook.com
            </a>
          </td>
        </tr>
      </table>
      <p style="margin: 12px 0 0 0; font-size: 12px; color: ${colors.muted};">
        Or use the attached .ics file
      </p>
    </div>
    ` : `
    <p style="margin: 24px 0 0 0; font-size: 14px; color: ${colors.muted};">
      A calendar invite is attached to this email. Add it to your calendar to get a reminder.
    </p>
    `}
  `

  return emailWrapper(content)
}

// Generate "Add to Calendar" links for different providers
export function generateCalendarLinks(params: {
  title: string
  description: string
  startDate: Date
  durationMinutes: number
  location?: string
}): { google: string; outlook: string; office365: string } {
  const { title, description, startDate, durationMinutes, location } = params

  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)

  // Format for Google Calendar (YYYYMMDDTHHmmssZ)
  const formatGoogleDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  // Format for Outlook/Office365 (ISO format)
  const formatOutlookDate = (date: Date) => date.toISOString()

  const encodedTitle = encodeURIComponent(title)
  const encodedDesc = encodeURIComponent(description)
  const encodedLocation = encodeURIComponent(location || '')

  // Google Calendar
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodedDesc}&location=${encodedLocation}`

  // Outlook.com (personal)
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodedTitle}&startdt=${formatOutlookDate(startDate)}&enddt=${formatOutlookDate(endDate)}&body=${encodedDesc}&location=${encodedLocation}`

  // Office 365 (work)
  const office365Url = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodedTitle}&startdt=${formatOutlookDate(startDate)}&enddt=${formatOutlookDate(endDate)}&body=${encodedDesc}&location=${encodedLocation}`

  return {
    google: googleUrl,
    outlook: outlookUrl,
    office365: office365Url,
  }
}

// Generate ICS calendar file content
export function generateICSContent(params: {
  title: string
  description: string
  startDate: Date
  durationMinutes: number
  location?: string
  organizerEmail?: string
  attendees?: Array<{ name: string; email: string }>
}): string {
  const { title, description, startDate, durationMinutes, location, organizerEmail, attendees } = params

  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)

  // Format date as YYYYMMDDTHHMMSSZ
  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  }

  const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@tacitknowledge.app`
  const now = formatICSDate(new Date())

  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Tacit Knowledge//Session Invite//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${title}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
${location ? `LOCATION:${location}` : ''}
${organizerEmail ? `ORGANIZER;CN=Tacit Knowledge:mailto:${organizerEmail}` : ''}
${attendees?.map(a => `ATTENDEE;CN=${a.name};RSVP=TRUE:mailto:${a.email}`).join('\n') || ''}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`

  return icsContent
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
