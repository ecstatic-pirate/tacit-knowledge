import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// In development, skip actual email sending unless a verified domain is configured
const isDev = process.env.NODE_ENV === 'development'
const hasVerifiedDomain = process.env.RESEND_FROM_EMAIL && !process.env.RESEND_FROM_EMAIL.includes('@resend.dev')

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  const fromEmail = from || process.env.RESEND_FROM_EMAIL || 'Tacit Knowledge <onboarding@resend.dev>'

  // In development without a verified domain, log instead of sending
  if (isDev && !hasVerifiedDomain) {
    console.log('\n📧 [DEV MODE] Email would be sent:')
    console.log(`   To: ${to}`)
    console.log(`   From: ${fromEmail}`)
    console.log(`   Subject: ${subject}`)
    console.log(`   (Set RESEND_FROM_EMAIL with a verified domain to send real emails)\n`)
    return { id: `dev-${Date.now()}` }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Error sending email:', error)
      throw new Error(error.message)
    }

    return data
  } catch (err) {
    console.error('Failed to send email:', err)
    throw err
  }
}

// Design tokens for email templates
export const emailDesign = {
  colors: {
    primary: '#1E3A5F',       // Deep navy
    background: '#FDFCFA',    // Warm off-white
    text: '#2C2C2C',          // Near black
    muted: '#6B7280',         // Gray
    border: '#E5E2DE',        // Warm gray border
    accent: '#C4A35A',        // Gold accent
  },
  fonts: {
    heading: "'Georgia', 'Times New Roman', serif",
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
}
