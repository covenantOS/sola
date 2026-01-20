"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CreditCard, ArrowUpRight, AlertCircle } from "lucide-react"

interface SubscriptionCardProps {
  membership: {
    id: string
    status: string
    tierId: string | null
    tierName: string
    tierPrice: number
    tierInterval: string
    currentPeriodEnd: Date | null
    stripeCustomerId: string | null
  }
  availableTiers: {
    id: string
    name: string
    price: number
    interval: string
  }[]
  primaryColor: string
  orgId: string
}

export function SubscriptionCard({
  membership,
  availableTiers,
  primaryColor,
  orgId,
}: SubscriptionCardProps) {
  const router = useRouter()
  const [isManaging, setIsManaging] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPaid = membership.tierPrice > 0
  const canUpgrade = availableTiers.some(
    (t) => t.price > membership.tierPrice && t.id !== membership.tierId
  )

  const handleManageSubscription = async () => {
    if (!membership.stripeCustomerId) {
      setError("No subscription to manage")
      return
    }

    setIsManaging(true)
    setError(null)

    try {
      const response = await fetch("/api/member/billing-portal", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to create billing portal session")
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsManaging(false)
    }
  }

  const handleCancelSubscription = async () => {
    setIsCancelling(true)
    setError(null)

    try {
      const response = await fetch("/api/member/cancel-subscription", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to cancel subscription")
      }

      setShowCancelConfirm(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div
        className="p-4 border"
        style={{
          backgroundColor: `${primaryColor}10`,
          borderColor: `${primaryColor}30`,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Current Plan</p>
            <p className="font-display text-xl text-white uppercase tracking-wide">
              {membership.tierName}
            </p>
          </div>
          <div className="text-right">
            {isPaid ? (
              <>
                <p className="text-2xl font-display" style={{ color: primaryColor }}>
                  ${membership.tierPrice}
                </p>
                <p className="text-white/40 text-xs">/{membership.tierInterval}</p>
              </>
            ) : (
              <p className="text-green-400 font-display">Free</p>
            )}
          </div>
        </div>

        {membership.currentPeriodEnd && membership.status === "ACTIVE" && (
          <p className="text-white/40 text-xs mt-3">
            {membership.status === "ACTIVE" ? "Renews" : "Ends"} on{" "}
            {new Date(membership.currentPeriodEnd).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}

        {membership.status === "PENDING" && (
          <p className="text-yellow-400 text-xs mt-3 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Payment pending - complete checkout to activate
          </p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {/* Upgrade button */}
        {canUpgrade && (
          <a
            href="/member/upgrade"
            className="flex items-center gap-2 px-4 py-2 font-display uppercase tracking-wide text-sm transition-all"
            style={{ backgroundColor: primaryColor, color: "#000" }}
          >
            <ArrowUpRight className="h-4 w-4" />
            Upgrade Plan
          </a>
        )}

        {/* Manage subscription */}
        {isPaid && membership.stripeCustomerId && (
          <button
            onClick={handleManageSubscription}
            disabled={isManaging}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white font-display uppercase tracking-wide text-sm hover:bg-white/20 transition-all disabled:opacity-50"
          >
            {isManaging ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Manage Billing
              </>
            )}
          </button>
        )}

        {/* Cancel subscription */}
        {isPaid && membership.status === "ACTIVE" && !showCancelConfirm && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="px-4 py-2 text-white/40 font-display uppercase tracking-wide text-sm hover:text-red-400 transition-colors"
          >
            Cancel Subscription
          </button>
        )}
      </div>

      {/* Cancel confirmation */}
      {showCancelConfirm && (
        <div className="p-4 bg-red-500/10 border border-red-500/30">
          <p className="text-white mb-4">
            Are you sure you want to cancel your subscription? You&apos;ll lose access to
            premium content at the end of your billing period.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-display uppercase tracking-wide text-sm disabled:opacity-50"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel"
              )}
            </button>
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="px-4 py-2 bg-white/10 text-white font-display uppercase tracking-wide text-sm"
            >
              Keep Subscription
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
