"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, Globe, Link2, CheckCircle, AlertCircle, Copy } from "lucide-react"
import { updateDomainSettings } from "@/app/actions/settings"
import { cn } from "@/lib/utils"

interface DomainFormProps {
  organizationId: string
  currentSlug: string
  currentCustomDomain: string | null
  subdomainBase: string
}

export function DomainForm({
  organizationId,
  currentSlug,
  currentCustomDomain,
  subdomainBase,
}: DomainFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [slug, setSlug] = useState(currentSlug)
  const [customDomain, setCustomDomain] = useState(currentCustomDomain || "")
  const [copied, setCopied] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updateDomainSettings({
        organizationId,
        slug,
        customDomain: customDomain || null,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        router.refresh()
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sola+ Subdomain */}
      <div className="bg-white/5 border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
            <Link2 className="h-5 w-5 text-sola-gold" />
          </div>
          <div>
            <h2 className="font-display text-lg text-white uppercase tracking-wide">
              Sola+ Subdomain
            </h2>
            <p className="text-sm text-white/60">
              Your default address on Sola+
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="your-community"
            className="flex-1 px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
          />
          <span className="text-white/60 whitespace-nowrap">.{subdomainBase}</span>
        </div>
        <p className="text-xs text-white/40 mt-2">
          Only lowercase letters, numbers, and hyphens. This is your primary Sola+ address.
        </p>
      </div>

      {/* Custom Domain */}
      <div className="bg-white/5 border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-sola-gold" />
          </div>
          <div>
            <h2 className="font-display text-lg text-white uppercase tracking-wide">
              Custom Domain
            </h2>
            <p className="text-sm text-white/60">
              Use your own domain name (optional)
            </p>
          </div>
        </div>

        <input
          type="text"
          value={customDomain}
          onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
          placeholder="community.yourdomain.com"
          className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
        />

        {/* DNS Instructions */}
        <div className="mt-4 p-4 bg-white/5 border border-white/10">
          <h3 className="font-display text-sm text-white uppercase tracking-wide mb-3">
            DNS Configuration
          </h3>
          <p className="text-sm text-white/60 mb-3">
            Add a CNAME record pointing to our servers:
          </p>
          <div className="flex items-center gap-2 bg-sola-black/50 p-3 border border-white/10">
            <code className="text-sm text-sola-gold flex-1 font-mono">
              CNAME → {subdomainBase}
            </code>
            <button
              type="button"
              onClick={() => handleCopy(subdomainBase)}
              className="p-2 hover:bg-white/10 transition-colors"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4 text-white/60" />
              )}
            </button>
          </div>
          <p className="text-xs text-white/40 mt-3">
            After adding the DNS record, it may take up to 24 hours to propagate.
            SSL certificates are automatically provisioned once the domain is verified.
          </p>
        </div>

        {/* Cloudflare Instructions */}
        <div className="mt-4 p-4 bg-white/5 border border-white/10">
          <h3 className="font-display text-sm text-white uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-sola-gold" />
            Cloudflare Users
          </h3>
          <p className="text-sm text-white/60">
            If using Cloudflare, set the proxy status to <span className="text-sola-gold">DNS Only</span> (grey cloud)
            for the CNAME record. This allows us to provision SSL certificates correctly.
          </p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-sola-red/10 border border-sola-red/30 text-sola-red text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          Domain settings updated! DNS changes may take time to propagate.
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  )
}
