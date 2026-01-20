"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, UserPlus, Eye, EyeOff, Check } from "lucide-react"

interface OrgInfo {
  name: string
  logo: string | null
  settings: { primaryColor?: string }
}

interface Tier {
  id: string
  name: string
  description: string | null
  price: number
  interval: string
  features: string[]
}

export default function MemberSignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null)
  const [tiers, setTiers] = useState<Tier[]>([])
  const [selectedTier, setSelectedTier] = useState<string | null>(null)

  // Get organization slug from subdomain
  const getOrgSlug = () => {
    if (typeof window !== "undefined") {
      const host = window.location.host
      const subdomain = host.split(".")[0]
      if (subdomain && subdomain !== "localhost" && subdomain !== "my" && subdomain !== "www") {
        return subdomain
      }
    }
    return null
  }

  // Load organization info and tiers
  useEffect(() => {
    const loadOrgInfo = async () => {
      const slug = getOrgSlug()
      if (!slug) return

      try {
        // Fetch org info
        const response = await fetch(`/api/org/${slug}`)
        if (response.ok) {
          const data = await response.json()
          setOrgInfo(data.organization)
          setTiers(data.tiers || [])
          // Default to first (free) tier
          if (data.tiers?.length > 0) {
            setSelectedTier(data.tiers[0].id)
          }
        }
      } catch {
        console.error("Failed to load org info")
      }
    }

    loadOrgInfo()
  }, [])

  const primaryColor = orgInfo?.settings?.primaryColor || "#D4A84B"

  const validatePassword = () => {
    if (password.length < 8) {
      return "Password must be at least 8 characters"
    }
    if (password !== confirmPassword) {
      return "Passwords do not match"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const passwordError = validatePassword()
    if (passwordError) {
      setError(passwordError)
      setIsLoading(false)
      return
    }

    const orgSlug = getOrgSlug()

    try {
      const response = await fetch("/api/member/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          organizationSlug: orgSlug,
          tierId: selectedTier,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create account")
        setIsLoading(false)
        return
      }

      // If paid tier, redirect to Stripe checkout
      if (data.requiresPayment && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }

      // Free tier - go directly to member dashboard
      router.push("/member")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 border border-white/10 p-8">
          <div className="text-center mb-8">
            {orgInfo?.logo ? (
              <img
                src={orgInfo.logo}
                alt={orgInfo.name}
                className="w-16 h-16 mx-auto mb-6 object-contain"
              />
            ) : (
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <UserPlus className="h-8 w-8" style={{ color: primaryColor }} />
              </div>
            )}
            <h1 className="font-display text-2xl text-white uppercase tracking-tight">
              Join {orgInfo?.name || "Our Community"}
            </h1>
            <p className="text-white/60 mt-2">
              Create your account to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="John Smith"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-white/40 text-xs mt-1">At least 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
              />
            </div>

            {/* Tier Selection - always show if tiers exist */}
            {tiers.length > 0 && (
              <div>
                <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-4">
                  {tiers.some(t => t.price === 0) ? "Select Plan" : "Select Membership"}
                </label>
                <div className="space-y-3">
                  {tiers.map((tier) => {
                    const features = typeof tier.features === "string"
                      ? JSON.parse(tier.features)
                      : tier.features || []
                    const isPaid = tier.price > 0

                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedTier(tier.id)}
                        className={`w-full p-4 border text-left transition-all ${
                          selectedTier === tier.id
                            ? "border-sola-gold bg-sola-gold/10"
                            : "border-white/10 bg-white/5 hover:border-white/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-white uppercase tracking-wide">
                            {tier.name}
                          </span>
                          <span style={{ color: isPaid ? primaryColor : "#22c55e" }}>
                            {isPaid ? `$${tier.price}/${tier.interval}` : "Free"}
                          </span>
                        </div>
                        {tier.description && (
                          <p className="text-white/60 text-sm mt-1">{tier.description}</p>
                        )}
                        {features.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {features.slice(0, 3).map((feature: string, idx: number) => (
                              <li key={idx} className="text-white/50 text-xs flex items-center gap-2">
                                <Check className="h-3 w-3" style={{ color: primaryColor }} />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}
                      </button>
                    )
                  })}
                </div>
                {!tiers.some(t => t.price === 0) && (
                  <p className="text-white/40 text-xs mt-3">
                    This community requires a paid membership. You&apos;ll be redirected to checkout after creating your account.
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="p-4 bg-sola-red/10 border border-sola-red/30 text-sola-red text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm text-sola-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <UserPlus className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-white/60 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="hover:underline" style={{ color: primaryColor }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
