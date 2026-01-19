import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export { resend }

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

const DEFAULT_FROM = 'Sola+ <noreply@solaplus.ai>'

export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, text, from = DEFAULT_FROM, replyTo } = options

  const result = await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
    replyTo,
  })

  return result
}

// Pre-built email templates

export async function sendWelcomeEmail(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Welcome to Sola+',
    html: `
      <h1>Welcome to Sola+, ${name}!</h1>
      <p>We're excited to have you on board.</p>
      <p>Get started by setting up your creator profile and connecting your Stripe account.</p>
    `,
  })
}

export async function sendMembershipConfirmation(
  email: string,
  memberName: string,
  organizationName: string,
  tierName: string
) {
  return sendEmail({
    to: email,
    subject: `Welcome to ${organizationName}!`,
    html: `
      <h1>You're now a member of ${organizationName}</h1>
      <p>Hi ${memberName},</p>
      <p>Your ${tierName} membership is now active.</p>
      <p>Log in to access your exclusive content.</p>
    `,
  })
}

export async function sendPaymentReceipt(
  email: string,
  memberName: string,
  amount: string,
  description: string
) {
  return sendEmail({
    to: email,
    subject: 'Payment Receipt',
    html: `
      <h1>Payment Received</h1>
      <p>Hi ${memberName},</p>
      <p>We received your payment of ${amount} for ${description}.</p>
      <p>Thank you for your support!</p>
    `,
  })
}

export async function sendStripeOnboardingReminder(
  email: string,
  creatorName: string,
  onboardingLink: string
) {
  return sendEmail({
    to: email,
    subject: 'Complete Your Stripe Setup',
    html: `
      <h1>Almost there, ${creatorName}!</h1>
      <p>Complete your Stripe setup to start accepting payments.</p>
      <a href="${onboardingLink}" style="display: inline-block; padding: 12px 24px; background: #635BFF; color: white; text-decoration: none; border-radius: 6px;">
        Complete Setup
      </a>
    `,
  })
}
