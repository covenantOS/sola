"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, LogIn, Eye, EyeOff } from "lucide-react"

export default function MemberLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get organization slug from subdomain (will be passed via middleware/context)
  const getOrgSlug = () => {
    if (typeof window !== "undefined") {
      const host = window.location.host
      const subdomain = host.split(".")[0]
      // Don't return 'localhost' or 'my' as valid slugs
      if (subdomain && subdomain !== "localhost" && subdomain !== "my" && subdomain !== "www") {
        return subdomain
      }
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const orgSlug = getOrgSlug()

    try {
      const response = await fetch("/api/member/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          organizationSlug: orgSlug,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to login")
        setIsLoading(false)
        return
      }

      // Redirect to member dashboard
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
            <div className="w-16 h-16 bg-sola-gold/10 flex items-center justify-center mx-auto mb-6">
              <LogIn className="h-8 w-8 text-sola-gold" />
            </div>
            <h1 className="font-display text-2xl text-white uppercase tracking-tight">
              Welcome Back
            </h1>
            <p className="text-white/60 mt-2">
              Sign in to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  autoComplete="current-password"
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
            </div>

            {error && (
              <div className="p-4 bg-sola-red/10 border border-sola-red/30 text-sola-red text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <LogIn className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-white/60 text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-sola-gold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
