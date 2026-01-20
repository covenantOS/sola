export const dynamic = "force-dynamic"

import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { getAccountStatus } from "@/lib/stripe"
import { StripeConnectCard } from "./stripe-connect-card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function PaymentsSettingsPage() {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return null
  }

  // Get Stripe account status if connected
  let stripeStatus = null
  if (organization.stripeAccountId) {
    try {
      stripeStatus = await getAccountStatus(organization.stripeAccountId)
    } catch (error) {
      console.error("Failed to get Stripe status:", error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/settings"
          className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white/60" />
        </Link>
        <div>
          <h1 className="font-display text-2xl text-white uppercase tracking-wide">
            Payment Settings
          </h1>
          <p className="text-white/60 mt-1">
            Connect your Stripe account to accept payments from members.
          </p>
        </div>
      </div>

      {/* Stripe Connect Card */}
      <StripeConnectCard
        stripeAccountId={organization.stripeAccountId}
        stripeStatus={
          stripeStatus
            ? {
                chargesEnabled: stripeStatus.chargesEnabled,
                payoutsEnabled: stripeStatus.payoutsEnabled,
                detailsSubmitted: stripeStatus.detailsSubmitted,
              }
            : null
        }
        onboardingComplete={organization.stripeOnboardingComplete}
      />

      {/* Platform Fee Info */}
      <div className="bg-white/5 border border-white/10 p-6">
        <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4">
          Platform Fee
        </h2>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl text-sola-gold">
            {process.env.PLATFORM_FEE_PERCENT || "5"}%
          </span>
          <span className="text-white/60">of each transaction</span>
        </div>
        <p className="text-sm text-white/40 mt-4">
          Sola+ charges a small platform fee on each transaction. Stripe&apos;s
          processing fees (2.9% + $0.30) are charged separately by Stripe.
        </p>
      </div>

      {/* Payout Info */}
      {stripeStatus?.payoutsEnabled && (
        <div className="bg-white/5 border border-white/10 p-6">
          <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4">
            Payouts
          </h2>
          <p className="text-white/60">
            Stripe automatically transfers your earnings to your connected bank
            account. The default payout schedule is daily, but you can adjust
            this in your Stripe Express Dashboard.
          </p>
        </div>
      )}
    </div>
  )
}
