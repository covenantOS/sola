import Stripe from "stripe"

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

/**
 * Stripe Connect Express Account Management
 */

// Create a new Express connected account
export async function createConnectedAccount(email: string) {
  const account = await stripe.accounts.create({
    type: "express",
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
    type: "account_onboarding",
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
  currency = "usd",
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

/**
 * Create Checkout Session for membership tier
 * Uses destination charges - money goes to creator's connected account
 */
export async function createMembershipCheckout({
  organizationId,
  tierId,
  tierName,
  priceInCents,
  interval,
  connectedAccountId,
  customerId,
  customerEmail,
  successUrl,
  cancelUrl,
  applicationFeePercent = 0,
}: {
  organizationId: string
  tierId: string
  tierName: string
  priceInCents: number
  interval: "month" | "year"
  connectedAccountId: string
  customerId?: string
  customerEmail: string
  successUrl: string
  cancelUrl: string
  applicationFeePercent?: number
}) {
  // Create or get customer
  let customer = customerId
  if (!customer) {
    const newCustomer = await stripe.customers.create({
      email: customerEmail,
      metadata: {
        organizationId,
      },
    })
    customer = newCustomer.id
  }

  // Calculate application fee
  const applicationFeeAmount = Math.round(
    (priceInCents * applicationFeePercent) / 100
  )

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: tierName,
            metadata: {
              tierId,
              organizationId,
            },
          },
          unit_amount: priceInCents,
          recurring: {
            interval,
          },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      application_fee_percent: applicationFeePercent,
      transfer_data: {
        destination: connectedAccountId,
      },
      metadata: {
        tierId,
        organizationId,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tierId,
      organizationId,
      customerEmail,
    },
  })

  return { sessionId: session.id, url: session.url, customerId: customer }
}

/**
 * Create a one-time payment checkout (for course purchases, etc.)
 */
export async function createOneTimeCheckout({
  organizationId,
  productId,
  productName,
  priceInCents,
  connectedAccountId,
  customerId,
  customerEmail,
  successUrl,
  cancelUrl,
  applicationFeePercent = 0,
  metadata = {},
}: {
  organizationId: string
  productId: string
  productName: string
  priceInCents: number
  connectedAccountId: string
  customerId?: string
  customerEmail: string
  successUrl: string
  cancelUrl: string
  applicationFeePercent?: number
  metadata?: Record<string, string>
}) {
  // Calculate application fee
  const applicationFeeAmount = Math.round(
    (priceInCents * applicationFeePercent) / 100
  )

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    customer_email: customerId ? undefined : customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: productName,
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: connectedAccountId,
      },
      metadata: {
        productId,
        organizationId,
        ...metadata,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      productId,
      organizationId,
      ...metadata,
    },
  })

  return { sessionId: session.id, url: session.url }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId)
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  atPeriodEnd = true
) {
  if (atPeriodEnd) {
    return stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
  }
  return stripe.subscriptions.cancel(subscriptionId)
}

/**
 * Create billing portal session for member to manage subscription
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session
}
