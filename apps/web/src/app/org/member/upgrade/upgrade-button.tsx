"use client"

import { useState } from "react"
import { Loader2, ArrowUpRight } from "lucide-react"

interface UpgradeButtonProps {
  tierId: string
  tierName: string
  primaryColor: string
}

export function UpgradeButton({ tierId, tierName, primaryColor }: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/member/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to start checkout")
        setIsLoading(false)
        return
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError("Something went wrong")
      setIsLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="text-red-400 text-xs mb-2">{error}</div>
      )}
      <button
        onClick={handleUpgrade}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-display uppercase tracking-wide transition-all disabled:opacity-50"
        style={{ backgroundColor: primaryColor, color: "#000" }}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Upgrade to {tierName}
            <ArrowUpRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  )
}
