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

  return (
    <div className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 group">
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
  )
}
