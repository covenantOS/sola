"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Save,
  Globe,
  Link2,
  CheckCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  ExternalLink,
} from "lucide-react"
import {
  updateDomainSettings,
  checkCustomDomainStatus,
  verifyCustomDomain,
} from "@/app/actions/settings"

interface DomainFormProps {
  organizationId: string
  currentSlug: string
  currentCustomDomain: string | null
  rootDomain: string
}

interface DomainStatus {
  exists: boolean
  verified: boolean
  configured: boolean
  misconfigured: boolean
  error?: string
}

interface DnsInstructions {
  type: "A" | "CNAME"
  name: string
  value: string
}

export function DomainForm({
  organizationId,
  currentSlug,
  currentCustomDomain,
  rootDomain,
}: DomainFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [slug, setSlug] = useState(currentSlug)
  const [customDomain, setCustomDomain] = useState(currentCustomDomain || "")
  const [copied, setCopied] = useState<string | null>(null)
  const [domainStatus, setDomainStatus] = useState<DomainStatus | null>(null)
  const [dnsInstructions, setDnsInstructions] = useState<DnsInstructions | null>(null)

  // Check domain status on load if there's a custom domain
  useEffect(() => {
    if (currentCustomDomain) {
      checkDomainStatusAsync(currentCustomDomain)
    }
  }, [currentCustomDomain])

  const checkDomainStatusAsync = async (domain: string) => {
    setIsChecking(true)
    try {
      const status = await checkCustomDomainStatus(domain)
      setDomainStatus(status)
      if (status.dnsInstructions) {
        setDnsInstructions(status.dnsInstructions)
      }
    } catch (err) {
      console.error("Failed to check domain status:", err)
    } finally {
      setIsChecking(false)
    }
  }

  const handleVerifyDomain = async () => {
    if (!customDomain) return
    setIsChecking(true)
    try {
      const result = await verifyCustomDomain(customDomain)
      if (result.verified) {
        setDomainStatus((prev) => prev ? { ...prev, verified: true, configured: true } : null)
        setSuccess(true)
      }
      // Refresh the status
      await checkDomainStatusAsync(customDomain)
    } catch (err) {
      console.error("Failed to verify domain:", err)
    } finally {
      setIsChecking(false)
    }
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
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

  // Determine if domain is an apex domain or subdomain
  const isApexDomain = customDomain && customDomain.split(".").length === 2

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
          <span className="text-white/60 whitespace-nowrap">.{rootDomain}</span>
        </div>
        <p className="text-xs text-white/40 mt-2">
          Only lowercase letters, numbers, and hyphens. This is your primary Sola+ address.
        </p>

        {/* Preview URL */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-white/60">Your site:</span>
          <a
            href={`https://${slug}.${rootDomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-sola-gold hover:underline flex items-center gap-1"
          >
            https://{slug}.{rootDomain}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
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

        {/* Domain Status */}
        {domainStatus && currentCustomDomain && (
          <div className="mt-4 p-4 bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm text-white uppercase tracking-wide">
                Domain Status
              </h3>
              <button
                type="button"
                onClick={handleVerifyDomain}
                disabled={isChecking}
                className="flex items-center gap-1 text-xs text-sola-gold hover:text-sola-gold/80 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`} />
                Refresh Status
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {domainStatus.configured && domainStatus.verified ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : domainStatus.misconfigured ? (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                )}
                <span className="text-sm text-white/80">
                  {domainStatus.configured && domainStatus.verified
                    ? "Domain is configured and SSL is active"
                    : domainStatus.misconfigured
                    ? "DNS is misconfigured - check records below"
                    : "Waiting for DNS configuration"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* DNS Instructions */}
        {customDomain && (
          <div className="mt-4 p-4 bg-white/5 border border-white/10">
            <h3 className="font-display text-sm text-white uppercase tracking-wide mb-3">
              DNS Configuration Required
            </h3>
            <p className="text-sm text-white/60 mb-4">
              Add the following DNS record in your domain provider's settings:
            </p>

            {isApexDomain ? (
              // Apex domain (example.com)
              <div className="space-y-3">
                <div className="bg-sola-black/50 p-3 border border-white/10">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-white/40 text-xs">Type</span>
                      <div className="text-sola-gold font-mono">A</div>
                    </div>
                    <div>
                      <span className="text-white/40 text-xs">Name</span>
                      <div className="text-white font-mono">@</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white/40 text-xs">Value</span>
                        <div className="text-white font-mono">76.76.21.21</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy("76.76.21.21", "a-record")}
                        className="p-2 hover:bg-white/10 transition-colors"
                      >
                        {copied === "a-record" ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4 text-white/60" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-white/40">
                  For apex domains (e.g., yourdomain.com), use an A record pointing to Vercel's IP.
                </p>
              </div>
            ) : (
              // Subdomain (courses.example.com)
              <div className="space-y-3">
                <div className="bg-sola-black/50 p-3 border border-white/10">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-white/40 text-xs">Type</span>
                      <div className="text-sola-gold font-mono">CNAME</div>
                    </div>
                    <div>
                      <span className="text-white/40 text-xs">Name</span>
                      <div className="text-white font-mono">{customDomain.split(".")[0]}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white/40 text-xs">Value</span>
                        <div className="text-white font-mono text-xs">cname.vercel-dns.com</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy("cname.vercel-dns.com", "cname")}
                        className="p-2 hover:bg-white/10 transition-colors"
                      >
                        {copied === "cname" ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4 text-white/60" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-white/40">
                  For subdomains (e.g., courses.yourdomain.com), use a CNAME record.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Cloudflare Instructions */}
        {customDomain && (
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30">
            <h3 className="font-display text-sm text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Cloudflare Users
            </h3>
            <p className="text-sm text-white/70">
              If using Cloudflare, set the proxy status to <span className="text-amber-400 font-semibold">DNS Only</span> (grey cloud icon)
              for your DNS record. This allows SSL certificates to be provisioned correctly.
            </p>
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Domain settings saved! {customDomain && "DNS changes may take up to 48 hours to propagate."}
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
