"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Play, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { markLessonComplete } from "@/app/actions/course"

interface Lesson {
  id: string
  title: string
  type: string
  muxPlaybackId: string | null
  videoDuration: number | null
  content: string | null
}

interface Props {
  lesson: Lesson
  courseSlug: string
  slug: string
  isCompleted: boolean
  previousLessonId: string | null | undefined
  nextLessonId: string | null | undefined
  userId: string | undefined
}

export function CoursePlayer({
  lesson,
  courseSlug,
  slug,
  isCompleted,
  previousLessonId,
  nextLessonId,
  userId,
}: Props) {
  const [completed, setCompleted] = useState(isCompleted)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleMarkComplete = () => {
    if (!userId || completed) return

    startTransition(async () => {
      const result = await markLessonComplete(lesson.id)
      if (result.success) {
        setCompleted(true)
        // Auto-advance to next lesson if available
        if (nextLessonId) {
          router.push(`/${slug}/courses/${courseSlug}?lesson=${nextLessonId}`)
        } else {
          router.refresh()
        }
      }
    })
  }

  const handleNavigate = (lessonId: string) => {
    router.push(`/${slug}/courses/${courseSlug}?lesson=${lessonId}`)
  }

  return (
    <div className="bg-sola-dark-navy">
      {/* Video Player */}
      {lesson.type === "VIDEO" && lesson.muxPlaybackId && (
        <div className="aspect-video bg-black">
          <div className="w-full h-full flex items-center justify-center">
            {/* Mux Player - Using iframe for simplicity */}
            <iframe
              src={`https://stream.mux.com/${lesson.muxPlaybackId}.m3u8`}
              className="w-full h-full"
              allowFullScreen
            />
            {/* For production, use @mux/mux-player-react */}
          </div>
        </div>
      )}

      {/* Placeholder for non-video lessons */}
      {lesson.type !== "VIDEO" && (
        <div className="aspect-video bg-sola-black flex items-center justify-center">
          <div className="text-center">
            <Play className="h-16 w-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">This is a {lesson.type.toLowerCase()} lesson</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 flex items-center justify-between border-t border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => previousLessonId && handleNavigate(previousLessonId)}
            disabled={!previousLessonId}
            className="flex items-center gap-1 px-3 py-2 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Previous</span>
          </button>
          <button
            onClick={() => nextLessonId && handleNavigate(nextLessonId)}
            disabled={!nextLessonId}
            className="flex items-center gap-1 px-3 py-2 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-sm">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={handleMarkComplete}
          disabled={completed || isPending || !userId}
          className={`flex items-center gap-2 px-4 py-2 font-display font-semibold uppercase tracking-widest text-sm transition-all ${
            completed
              ? "bg-green-500/20 text-green-500 cursor-default"
              : "bg-sola-gold text-sola-black hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] disabled:opacity-50"
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          {completed ? "Completed" : isPending ? "Marking..." : "Mark Complete"}
        </button>
      </div>
    </div>
  )
}
