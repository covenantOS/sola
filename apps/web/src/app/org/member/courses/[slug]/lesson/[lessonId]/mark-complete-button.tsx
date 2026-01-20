"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Circle, Loader2 } from "lucide-react"

interface MarkCompleteButtonProps {
  lessonId: string
  isCompleted: boolean
  primaryColor: string
}

export function MarkCompleteButton({
  lessonId,
  isCompleted: initialCompleted,
  primaryColor,
}: MarkCompleteButtonProps) {
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)

    try {
      if (isCompleted) {
        // Uncomplete
        const response = await fetch("/api/member/lesson/uncomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId }),
        })

        if (response.ok) {
          setIsCompleted(false)
          router.refresh()
        }
      } else {
        // Complete
        const response = await fetch("/api/member/lesson/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId }),
        })

        if (response.ok) {
          setIsCompleted(true)
          router.refresh()
        }
      }
    } catch (error) {
      console.error("Failed to toggle completion:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 border transition-all ${
        isCompleted
          ? "border-transparent"
          : "border-white/20 hover:border-white/40"
      }`}
      style={
        isCompleted
          ? { backgroundColor: `${primaryColor}20`, color: primaryColor }
          : { color: "rgba(255,255,255,0.6)" }
      }
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isCompleted ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <Circle className="h-4 w-4" />
      )}
      {isCompleted ? "Completed" : "Mark as Complete"}
    </button>
  )
}
