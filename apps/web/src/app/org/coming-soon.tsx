"use client"

import { useState } from "react"
import { Rocket, Bell, CheckCircle2 } from "lucide-react"

interface ComingSoonPageProps {
  org: {
    id: string
    name: string
    logo: string | null
    description: string | null
  }
  primaryColor: string
}

export function ComingSoonPage({ org, primaryColor }: ComingSoonPageProps) {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)

    // In a real implementation, this would save to a waitlist
    // For now, we'll just simulate success
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSubmitted(true)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-sola-black flex flex-col">
      {/* Accent line */}
      <div
        className="fixed top-0 left-0 right-0 h-1"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          {/* Logo */}
          {org.logo ? (
            <img
              src={org.logo}
              alt={org.name}
              className="w-20 h-20 mx-auto mb-8 object-contain"
            />
          ) : (
            <div
              className="w-20 h-20 mx-auto mb-8 flex items-center justify-center font-display text-3xl text-sola-black"
              style={{ backgroundColor: primaryColor }}
            >
              {org.name[0]}
            </div>
          )}

          {/* Coming Soon */}
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-display uppercase tracking-wider mb-6"
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
            >
              <Rocket className="h-3 w-3" />
              Coming Soon
            </div>

            <h1 className="font-display text-4xl text-white uppercase tracking-tight mb-4">
              {org.name}
            </h1>

            {org.description && (
              <p className="text-white/60 leading-relaxed">
                {org.description}
              </p>
            )}
          </div>

          {/* Email signup */}
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-white/40 text-sm">
                Get notified when we launch
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 font-display font-semibold uppercase tracking-wider text-sm transition-all disabled:opacity-50"
                  style={{ backgroundColor: primaryColor, color: "#000" }}
                >
                  {isLoading ? (
                    "..."
                  ) : (
                    <>
                      <Bell className="h-4 w-4" />
                      Notify Me
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div
              className="flex items-center justify-center gap-2 py-4"
              style={{ color: primaryColor }}
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-display uppercase tracking-wide">
                You're on the list!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-white/30 text-xs">
          Powered by{" "}
          <a
            href="https://solaplus.ai"
            className="hover:text-white transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sola+
          </a>
        </p>
      </footer>
    </div>
  )
}
