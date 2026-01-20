"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Loader2,
  X,
  ExternalLink,
  Star,
  RefreshCw,
} from "lucide-react"

interface DomainRowProps {
  domain: {
    id: string
    domain: string
    status: string
    targetType: string
    targetId: string | null
    isPrimary: boolean
    verificationToken: string | null
  }
}

export function DomainRow({ domain }: DomainRowProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/domains?id=${domain.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to delete domain:", error)
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  const handleVerify = async () => {
    setIsVerifying(true)
    setVerifyError(null)

    try {
      const res = await fetch("/api/domains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId: domain.id }),
      })

      const data = await res.json()

      if (!res.ok) {
        setVerifyError(data.error || "Verification failed")
      } else if (!data.verified) {
        setVerifyError(data.error || "Domain not verified yet. Check your DNS settings.")
      }

      router.refresh()
    } catch (error) {
      console.error("Failed to verify domain:", error)
      setVerifyError("Failed to verify domain")
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="p-4 border-b border-white/5 last:border-0 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Globe className="h-5 w-5 text-white/40" />
          <div>
            <div className="flex items-center gap-2">
              <a
                href={`https://${domain.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-sola-gold transition-colors flex items-center gap-1"
              >
                {domain.domain}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              {domain.isPrimary && (
                <span className="text-xs px-2 py-0.5 bg-sola-gold/20 text-sola-gold flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Primary
                </span>
              )}
            </div>
            <p className="text-xs text-white/40 mt-1">
              Points to: {domain.targetType.toLowerCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status */}
          {domain.status === "VERIFIED" ? (
            <span className="flex items-center gap-1 text-green-400 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Verified
            </span>
          ) : domain.status === "ERROR" ? (
            <span className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              Error
            </span>
          ) : (
            <span className="flex items-center gap-1 text-orange-400 text-sm">
              <Clock className="h-4 w-4" />
              Pending
            </span>
          )}

          {/* Verify button (for pending domains) */}
          {domain.status !== "VERIFIED" && (
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="flex items-center gap-1 text-sm text-white/60 hover:text-sola-gold transition-colors disabled:opacity-50"
              title="Check DNS verification"
            >
              {isVerifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Verify
            </button>
          )}

          {/* Delete */}
          {showConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm"
                )}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-white/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete domain"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Verification error */}
      {verifyError && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p>{verifyError}</p>
            <p className="text-red-400/60 text-xs mt-1">
              Add a CNAME record pointing <code className="bg-white/10 px-1">{domain.domain}</code> to{" "}
              <code className="bg-white/10 px-1">cname.vercel-dns.com</code>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
