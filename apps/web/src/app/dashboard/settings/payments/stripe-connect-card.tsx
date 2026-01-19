"use client"

import { useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import {
  connectStripeAccount,
  getStripeDashboardLink,
  refreshStripeStatus,
} from "@/app/actions/stripe"
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  CreditCard,
} from "lucide-react"

interface StripeConnectCardProps {
  stripeAccountId: string | null
  stripeStatus: {
    chargesEnabled: boolean
    payoutsEnabled: boolean
    detailsSubmitted: boolean
  } | null
  onboardingComplete: boolean
}

export function StripeConnectCard({
  stripeAccountId,
  stripeStatus,
  onboardingComplete,
}: StripeConnectCardProps) {
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Check for success/refresh params from Stripe redirect
  const isSuccess = searchParams.get("success") === "true"
  const needsRefresh = searchParams.get("refresh") === "true"

  const isConnected = stripeAccountId && stripeStatus?.detailsSubmitted
  const isActive = stripeStatus?.chargesEnabled && stripeStatus?.payoutsEnabled

  async function handleConnect() {
    setError(null)
    startTransition(async () => {
      const result = await connectStripeAccount()
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.url) {
        window.location.href = result.url
      }
    })
  }

  async function handleDashboard() {
    setError(null)
    startTransition(async () => {
      const result = await getStripeDashboardLink()
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.url) {
        window.open(result.url, "_blank")
      }
    })
  }

  async function handleRefresh() {
    setError(null)
    startTransition(async () => {
      const result = await refreshStripeStatus()
      if (result.error) {
        setError(result.error)
      }
    })
  }

  // Not connected state
  if (!stripeAccountId) {
    return (
      <div className="bg-white/5 border border-white/10 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-sola-gold/10 flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-6 w-6 text-sola-gold" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg text-white uppercase tracking-wide">
              Connect Stripe
            </h2>
            <p className="text-white/60 mt-1 mb-4">
              Connect your Stripe account to start accepting payments. You&apos;ll
              be able to receive membership payments, course purchases, and
              donations directly to your bank account.
            </p>

            {error && (
              <div className="p-3 mb-4 bg-sola-red/10 border border-sola-red/30 text-sola-red text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={isPending}
              className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Connect with Stripe
                  <ExternalLink className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Pending/incomplete onboarding
  if (!onboardingComplete || !isActive) {
    return (
      <div className="bg-white/5 border border-sola-gold/30 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-sola-gold/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-sola-gold" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg text-white uppercase tracking-wide">
              Complete Stripe Setup
            </h2>
            <p className="text-white/60 mt-1 mb-4">
              Your Stripe account is connected but setup is incomplete. Please
              complete the onboarding process to start accepting payments.
            </p>

            {(isSuccess || needsRefresh) && (
              <div className="p-3 mb-4 bg-sola-gold/10 border border-sola-gold/30 text-sola-gold text-sm">
                {isSuccess
                  ? "Onboarding submitted! Click refresh to update your status."
                  : "Please complete the Stripe onboarding and return here."}
              </div>
            )}

            {error && (
              <div className="p-3 mb-4 bg-sola-red/10 border border-sola-red/30 text-sola-red text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleConnect}
                disabled={isPending}
                className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Continue Setup
                    <ExternalLink className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                onClick={handleRefresh}
                disabled={isPending}
                className="inline-flex items-center gap-2 bg-transparent text-white border border-white/30 font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fully connected and active
  return (
    <div className="bg-white/5 border border-green-500/30 p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-green-500/10 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-lg text-white uppercase tracking-wide">
            Stripe Connected
          </h2>
          <p className="text-white/60 mt-1 mb-4">
            Your Stripe account is fully connected and ready to accept payments.
            You can manage your account, view payouts, and configure settings in
            your Stripe Express Dashboard.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-black/20">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wide">
                Charges
              </p>
              <p className="text-sm text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Enabled
              </p>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wide">
                Payouts
              </p>
              <p className="text-sm text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Enabled
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-sola-red/10 border border-sola-red/30 text-sola-red text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDashboard}
              disabled={isPending}
              className="inline-flex items-center gap-2 bg-transparent text-white border border-white/30 font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:border-sola-gold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Stripe Dashboard
                  <ExternalLink className="h-4 w-4" />
                </>
              )}
            </button>

            <button
              onClick={handleRefresh}
              disabled={isPending}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
