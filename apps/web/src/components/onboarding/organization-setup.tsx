"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createUserOrganization } from "@/app/actions/user"
import { Building2, Loader2 } from "lucide-react"

interface OrganizationSetupProps {
  userName?: string
}

export function OrganizationSetup({ userName }: OrganizationSetupProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createUserOrganization(formData)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <div className="min-h-screen bg-sola-black flex items-center justify-center p-4">
      {/* Red accent line at top */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-sola-red z-[60]" />

      <div className="w-full max-w-md">
        <div className="bg-white/5 border border-white/10 p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-sola-gold/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-sola-gold" />
            </div>
          </div>

          <h1 className="font-display text-2xl text-white uppercase tracking-wide text-center mb-2">
            Welcome{userName ? `, ${userName}` : ""}!
          </h1>
          <p className="text-white/60 text-center mb-8">
            Let&apos;s set up your creator organization to get started.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2"
              >
                Organization Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                minLength={2}
                maxLength={100}
                placeholder="My Ministry"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
              />
              <p className="mt-1 text-xs text-white/40">
                This will be shown to your members and used in your subdomain.
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2"
              >
                Description{" "}
                <span className="text-white/40 normal-case">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={500}
                placeholder="A brief description of your ministry or community..."
                className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-sola-red/10 border border-sola-red/30 text-sola-red text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-4 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Organization"
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-white/40 text-center">
            You can always change these settings later.
          </p>
        </div>
      </div>
    </div>
  )
}
