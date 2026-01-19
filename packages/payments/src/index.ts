import Stripe from 'stripe'

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export { stripe }

/**
 * Stripe Connect Express Account Management
 */

// Create a new Express connected account
export async function createConnectedAccount(email: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })
  return account
}

// Generate onboarding link for a connected account
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })
  return accountLink
}

// Generate login link to Stripe Express Dashboard
export async function createLoginLink(accountId: string) {
  const loginLink = await stripe.accounts.createLoginLink(accountId)
  return loginLink
}

// Check account status
export async function getAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId)
  return {
    id: account.id,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    requirements: account.requirements,
  }
}

/**
 * Destination Charges - Platform takes fee, money goes to connected account
 */

// Create a payment intent with destination charge
export async function createDestinationCharge({
  amount,
  currency = 'usd',
  connectedAccountId,
  applicationFeeAmount,
  customerId,
  metadata,
}: {
  amount: number // in cents
  currency?: string
  connectedAccountId: string
  applicationFeeAmount: number // Platform fee in cents
  customerId?: string
  metadata?: Record<string, string>
}) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    application_fee_amount: applicationFeeAmount,
    transfer_data: {
      destination: connectedAccountId,
    },
    metadata,
  })
  return paymentIntent
}

/**
 * Subscriptions with Stripe Connect
 */

// Create a subscription with destination charges
export async function createConnectedSubscription({
  customerId,
  priceId,
  connectedAccountId,
  applicationFeePercent,
}: {
  customerId: string
  priceId: string
  connectedAccountId: string
  applicationFeePercent: number // e.g., 5 for 5%
}) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    application_fee_percent: applicationFeePercent,
    transfer_data: {
      destination: connectedAccountId,
    },
  })
  return subscription
}

/**
 * Customer Management
 */

export async function createCustomer(email: string, name?: string) {
  const customer = await stripe.customers.create({
    email,
    name,
  })
  return customer
}

export async function getCustomer(customerId: string) {
  const customer = await stripe.customers.retrieve(customerId)
  return customer
}

/**
 * Webhook Signature Verification
 */

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
) {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
