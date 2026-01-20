import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, ArrowRight } from "lucide-react"
import { stripe } from "@/lib/stripe"

export const dynamic = "force-dynamic"

export default async function UpgradeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams
  const member = await getCurrentMember()
  const org = await getOrganizationByDomain()

  if (!member || !org) {
    redirect("/login")
  }

  // Get org settings
  const settings = (org.settings as Record<string, unknown>) || {}
  const primaryColor = (settings.primaryColor as string) || "#D4A84B"

  let tier = null
  let subscriptionUpdated = false

  // Process the checkout session
  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["subscription"],
      })

      if (session.status === "complete") {
        const tierId = session.metadata?.tierId
        const subscription = session.subscription as any

        if (tierId && subscription) {
          // Get the tier
          tier = await db.membershipTier.findUnique({
            where: { id: tierId },
          })

          // Update membership
          await db.membership.update({
            where: {
              userId_organizationId: {
                userId: member.id,
                organizationId: org.id,
              },
            },
            data: {
              tierId,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId:
                typeof session.customer === "string"
                  ? session.customer
                  : session.customer?.id,
              currentPeriodEnd: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : null,
              status: "ACTIVE",
            },
          })

          subscriptionUpdated = true
        }
      }
    } catch (error) {
      console.error("Error processing checkout session:", error)
    }
  }

  // Get current membership
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: member.id,
        organizationId: org.id,
      },
    },
    include: {
      tier: true,
    },
  })

  return (
    <div className="max-w-lg mx-auto text-center py-12">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ backgroundColor: `${primaryColor}20` }}
      >
        <CheckCircle2 className="h-10 w-10" style={{ color: primaryColor }} />
      </div>

      <h1 className="font-display text-3xl text-white uppercase tracking-tight mb-4">
        Welcome to {tier?.name || membership?.tier?.name || "Premium"}!
      </h1>

      <p className="text-white/60 mb-8">
        Your membership has been upgraded successfully. You now have access to all
        premium content and features.
      </p>

      <div className="space-y-4">
        <Link
          href="/member"
          className="inline-flex items-center gap-2 font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all"
          style={{ backgroundColor: primaryColor, color: "#000" }}
        >
          Go to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>

        <div>
          <Link
            href="/member/courses"
            className="text-white/60 hover:text-white transition-colors text-sm"
          >
            Browse Premium Courses
          </Link>
        </div>
      </div>

      {membership?.currentPeriodEnd && (
        <p className="text-white/40 text-xs mt-8">
          Your subscription renews on{" "}
          {new Date(membership.currentPeriodEnd).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      )}
    </div>
  )
}
