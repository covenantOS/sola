"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2, X } from "lucide-react"

interface DeleteChannelButtonProps {
  channelId: string
  channelName: string
}

export function DeleteChannelButton({ channelId, channelName }: DeleteChannelButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/channels/${channelId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        router.push("/dashboard/community/channels")
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to delete channel:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/60">Delete "{channelName}"?</span>
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="p-2 text-white/40 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
      Delete Channel
    </button>
  )
}
