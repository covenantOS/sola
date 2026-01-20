"use client"

import { useState, useEffect } from "react"
import {
  Globe,
  Plus,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react"

type Domain = {
  id: string
  domain: string
  type: "subdomain" | "custom"
  verified: boolean
  target: string
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDomain, setShowAddDomain] = useState(false)
  const [newDomain, setNewDomain] = useState("")
  const [verifying, setVerifying] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Simulate loading domains
    setTimeout(() => {
      setDomains([
        {
          id: "1",
          domain: "test-ministry.my.solaplus.ai",
          type: "subdomain",
          verified: true,
          target: "community",
        },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return

    // Add domain (would call API in production)
    const domain: Domain = {
      id: Date.now().toString(),
      domain: newDomain.trim(),
      type: "custom",
      verified: false,
      target: "community",
    }

    setDomains((prev) => [...prev, domain])
    setNewDomain("")
    setShowAddDomain(false)
  }

  const handleVerify = async (domainId: string) => {
    setVerifying(domainId)

    // Simulate verification check
    setTimeout(() => {
      setDomains((prev) =>
        prev.map((d) => (d.id === domainId ? { ...d, verified: true } : d))
      )
      setVerifying(null)
    }, 2000)
  }

  const handleRemove = (domainId: string) => {
    if (!confirm("Are you sure you want to remove this domain?")) return
    setDomains((prev) => prev.filter((d) => d.id !== domainId))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sola-gold"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white uppercase tracking-tight">
            Domains
          </h1>
          <p className="text-white/60 mt-2">
            Manage your community domains
          </p>
        </div>
        <button
          onClick={() => setShowAddDomain(true)}
          className="flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
        >
          <Plus className="h-4 w-4" />
          Add Domain
        </button>
      </div>

      {/* Add Domain Form */}
      {showAddDomain && (
        <div className="bg-white/5 border border-white/10 p-6">
          <h3 className="font-display text-lg text-white uppercase tracking-wide mb-4">
            Add Custom Domain
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                Domain Name
              </label>
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-sola-gold focus:outline-none"
                placeholder="community.yourdomain.com"
              />
            </div>

            <div className="bg-sola-dark-navy border border-white/10 p-4">
              <h4 className="font-display text-white text-sm uppercase tracking-wide mb-2">
                DNS Configuration
              </h4>
              <p className="text-white/60 text-sm mb-4">
                Add the following CNAME record to your DNS settings:
              </p>
              <div className="bg-white/5 p-3 flex items-center justify-between">
                <code className="text-sola-gold text-sm">
                  CNAME → proxy.solaplus.ai
                </code>
                <button
                  onClick={() => copyToClipboard("proxy.solaplus.ai")}
                  className="p-2 text-white/40 hover:text-white transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowAddDomain(false)
                  setNewDomain("")
                }}
                className="px-6 py-3 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDomain}
                disabled={!newDomain.trim()}
                className="bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm disabled:opacity-50"
              >
                Add Domain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domains List */}
      <div className="space-y-4">
        {domains.map((domain) => (
          <div
            key={domain.id}
            className="bg-white/5 border border-white/10 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-sola-gold/10 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-sola-gold" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`https://${domain.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-display text-lg text-white uppercase tracking-wide hover:text-sola-gold flex items-center gap-2"
                    >
                      {domain.domain}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    {domain.type === "subdomain" && (
                      <span className="bg-white/10 text-white/60 text-xs px-2 py-1 uppercase tracking-wide">
                        Default
                      </span>
                    )}
                    {domain.verified ? (
                      <span className="flex items-center gap-1 text-green-500 text-xs">
                        <Check className="h-3 w-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sola-gold text-xs">
                        <AlertCircle className="h-3 w-3" />
                        Pending Verification
                      </span>
                    )}
                  </div>
                  <p className="text-white/50 text-sm mt-1">
                    Points to: {domain.target}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!domain.verified && (
                  <button
                    onClick={() => handleVerify(domain.id)}
                    disabled={verifying === domain.id}
                    className="flex items-center gap-2 border border-white/30 text-white font-display uppercase tracking-widest px-4 py-2 text-xs hover:border-sola-gold transition-colors disabled:opacity-50"
                  >
                    {verifying === domain.id ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3" />
                        Verify
                      </>
                    )}
                  </button>
                )}
                {domain.type !== "subdomain" && (
                  <button
                    onClick={() => handleRemove(domain.id)}
                    className="p-2 text-white/40 hover:text-sola-red transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {!domain.verified && domain.type === "custom" && (
              <div className="mt-4 p-4 bg-sola-gold/5 border border-sola-gold/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-sola-gold flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm">
                      Add this CNAME record to verify your domain:
                    </p>
                    <code className="block mt-2 text-sola-gold text-sm bg-white/5 px-3 py-2">
                      {domain.domain} → CNAME → proxy.solaplus.ai
                    </code>
                    <p className="text-white/50 text-xs mt-2">
                      DNS changes can take up to 48 hours to propagate.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {domains.length === 0 && (
        <div className="bg-white/5 border border-white/10 p-12 text-center">
          <Globe className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <h2 className="font-display text-xl text-white uppercase tracking-wide mb-2">
            No Domains
          </h2>
          <p className="text-white/60 mb-6">
            Add a custom domain to brand your community
          </p>
          <button
            onClick={() => setShowAddDomain(true)}
            className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Domain
          </button>
        </div>
      )}
    </div>
  )
}
