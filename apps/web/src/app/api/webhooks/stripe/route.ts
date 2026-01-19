import { NextRequest, NextResponse } from "next/server"
import { constructWebhookEvent, stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import type Stripe from "stripe"
import type { Prisma } from "@prisma/client"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = constructWebhookEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Check if we've already processed this event
  const existingEvent = await db.stripeEvent.findUnique({
    where: { stripeEventId: event.id },
  })

  if (existingEvent?.processed) {
    return NextResponse.json({ received: true, already_processed: true })
  }

  // Store the event
  await db.stripeEvent.upsert({
    where: { stripeEventId: event.id },
    create: {
      stripeEventId: event.id,
      type: event.type,
      data: event.data as unknown as Prisma.InputJsonValue,
    },
    update: {
      type: event.type,
      data: event.data as unknown as Prisma.InputJsonValue,
    },
  })

  try {
    // Handle the event
    switch (event.type) {
      // ============ ACCOUNT EVENTS ============
      case "account.updated": {
        const account = event.data.object as Stripe.Account
        await handleAccountUpdated(account)
        break
      }

      // ============ CHECKOUT EVENTS ============
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      // ============ SUBSCRIPTION EVENTS ============
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      // ============ PAYMENT EVENTS ============
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSucceeded(paymentIntent)
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailed(paymentIntent)
        break
      }

      // ============ INVOICE EVENTS ============
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Mark event as processed
    await db.stripeEvent.update({
      where: { stripeEventId: event.id },
      data: { processed: true },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error)

    // Store the error
    await db.stripeEvent.update({
      where: { stripeEventId: event.id },
      data: {
        processingError: error instanceof Error ? error.message : "Unknown error",
      },
    })

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

// ============ HANDLER FUNCTIONS ============

async function handleAccountUpdated(account: Stripe.Account) {
  // Find organization by Stripe account ID
  const organization = await db.organization.findUnique({
    where: { stripeAccountId: account.id },
  })

  if (!organization) {
    console.log(`No organization found for Stripe account ${account.id}`)
    return
  }

  // Determine account status
  let status = "pending"
  if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
    status = "active"
  } else if (account.requirements?.disabled_reason) {
    status = "restricted"
  }

  // Update organization
  await db.organization.update({
    where: { id: organization.id },
    data: {
      stripeAccountStatus: status,
      stripeOnboardingComplete: account.details_submitted && account.charges_enabled,
    },
  })

  console.log(`Updated organization ${organization.id} Stripe status to ${status}`)
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {}
  const { type, organizationId, userId, courseId, tierId } = metadata

  if (type === "course_purchase" && courseId && userId) {
    // Create or update enrollment
    await db.enrollment.upsert({
      where: {
        userId_courseId: { userId, courseId },
      },
      create: {
        userId,
        courseId,
        stripePaymentIntentId: session.payment_intent as string,
        paidAmount: session.amount_total ? session.amount_total / 100 : null,
      },
      update: {
        stripePaymentIntentId: session.payment_intent as string,
        paidAmount: session.amount_total ? session.amount_total / 100 : null,
      },
    })

    console.log(`Enrolled user ${userId} in course ${courseId}`)
  } else if (type === "membership" && organizationId && userId && tierId) {
    // Update membership with subscription info
    const subscriptionId = session.subscription as string

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)

      await db.membership.updateMany({
        where: {
          userId,
          organizationId,
        },
        data: {
          tierId,
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: session.customer as string,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          status: "ACTIVE",
        },
      })

      console.log(`Updated membership for user ${userId} in org ${organizationId}`)
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Find membership by subscription ID
  const membership = await db.membership.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  })

  if (!membership) {
    console.log(`No membership found for subscription ${subscription.id}`)
    return
  }

  // Map Stripe status to our status
  let status: "ACTIVE" | "PAUSED" | "CANCELLED" | "PAST_DUE" = "ACTIVE"
  switch (subscription.status) {
    case "active":
    case "trialing":
      status = "ACTIVE"
      break
    case "past_due":
      status = "PAST_DUE"
      break
    case "paused":
      status = "PAUSED"
      break
    case "canceled":
    case "unpaid":
      status = "CANCELLED"
      break
  }

  await db.membership.update({
    where: { id: membership.id },
    data: {
      status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })

  console.log(`Updated membership ${membership.id} status to ${status}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Find and update membership
  const membership = await db.membership.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  })

  if (!membership) {
    console.log(`No membership found for subscription ${subscription.id}`)
    return
  }

  await db.membership.update({
    where: { id: membership.id },
    data: {
      status: "CANCELLED",
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
    },
  })

  console.log(`Cancelled membership ${membership.id}`)
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata || {}
  console.log(`Payment succeeded: ${paymentIntent.id}`, metadata)
  // Additional handling based on metadata if needed
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata || {}
  console.log(`Payment failed: ${paymentIntent.id}`, metadata)
  // Could send notification to user here
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`Invoice paid: ${invoice.id}`)
  // Could update payment history or send receipt
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Invoice payment failed: ${invoice.id}`)
  // Could send notification to user about failed payment
}
