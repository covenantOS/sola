"use client"

import { useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import MuxPlayer from "@mux/mux-player-react"

interface LessonVideoPlayerProps {
  playbackId: string
  lessonId: string
  courseSlug: string
  nextLessonId?: string
}

export function LessonVideoPlayer({
  playbackId,
  lessonId,
  courseSlug,
  nextLessonId,
}: LessonVideoPlayerProps) {
  const router = useRouter()
  const playerRef = useRef<any>(null)
  const hasMarkedComplete = useRef(false)

  // Mark lesson as complete when video ends
  const handleEnded = async () => {
    if (hasMarkedComplete.current) return
    hasMarkedComplete.current = true

    try {
      await fetch("/api/member/lesson/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      })

      // Navigate to next lesson after a short delay
      if (nextLessonId) {
        setTimeout(() => {
          router.push(`/member/courses/${courseSlug}/lesson/${nextLessonId}`)
          router.refresh()
        }, 1500)
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to mark lesson complete:", error)
    }
  }

  // Mark as complete if user watches more than 90%
  const handleTimeUpdate = async (event: Event) => {
    const player = event.target as any
    if (!player || hasMarkedComplete.current) return

    const percentWatched = (player.currentTime / player.duration) * 100
    if (percentWatched >= 90) {
      hasMarkedComplete.current = true
      try {
        await fetch("/api/member/lesson/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId }),
        })
      } catch (error) {
        console.error("Failed to mark lesson complete:", error)
      }
    }
  }

  return (
    <div className="aspect-video bg-black">
      <MuxPlayer
        ref={playerRef}
        streamType="on-demand"
        playbackId={playbackId}
        metadata={{
          video_title: "Lesson Video",
        }}
        primaryColor="#D4A84B"
        secondaryColor="#000000"
        className="w-full h-full"
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        autoPlay={false}
      />
    </div>
  )
}
