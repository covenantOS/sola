"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, BookOpen } from "lucide-react"

interface EnrollButtonProps {
  courseId: string
  primaryColor: string
}

export function EnrollButton({ courseId, primaryColor }: EnrollButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEnroll = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/member/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to enroll")
        setIsLoading(false)
        return
      }

      // Refresh the page to show enrollment state
      router.refresh()
    } catch {
      setError("Something went wrong")
      setIsLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
      <button
        onClick={handleEnroll}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all disabled:opacity-50"
        style={{ backgroundColor: primaryColor, color: "#000" }}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enrolling...
          </>
        ) : (
          <>
            <BookOpen className="h-4 w-4" />
            Enroll Now - Free
          </>
        )}
      </button>
    </div>
  )
}
