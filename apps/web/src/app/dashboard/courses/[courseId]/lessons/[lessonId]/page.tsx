"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Save,
  PlayCircle,
  FileText,
  HelpCircle,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
} from "lucide-react"
import { VideoUploader } from "@/components/course/video-uploader"
import { updateLesson } from "@/app/actions/course"
import { db } from "@/lib/db"

type Lesson = {
  id: string
  title: string
  description: string | null
  type: "VIDEO" | "TEXT" | "QUIZ" | "ASSIGNMENT" | "DOWNLOAD"
  content: string | null
  muxPlaybackId: string | null
  muxAssetId: string | null
  videoDuration: number | null
  isFreePreview: boolean
  position: number
  moduleId: string
}

type Module = {
  id: string
  title: string
  courseId: string
  course: {
    id: string
    title: string
  }
}

const typeIcons = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
  DOWNLOAD: Download,
}

const typeLabels = {
  VIDEO: "Video Lesson",
  TEXT: "Text Lesson",
  QUIZ: "Quiz",
  ASSIGNMENT: "Assignment",
  DOWNLOAD: "Download",
}

export default function LessonEditorPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const lessonId = params.lessonId as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [isFreePreview, setIsFreePreview] = useState(false)

  // Load lesson data
  useEffect(() => {
    async function loadLesson() {
      try {
        const res = await fetch(`/api/lessons/${lessonId}`)
        if (!res.ok) {
          throw new Error("Failed to load lesson")
        }
        const data = await res.json()
        setLesson(data.lesson)
        setModule(data.module)
        setTitle(data.lesson.title)
        setDescription(data.lesson.description || "")
        setContent(data.lesson.content || "")
        setIsFreePreview(data.lesson.isFreePreview)
      } catch (error) {
        console.error("Failed to load lesson:", error)
      } finally {
        setLoading(false)
      }
    }
    loadLesson()
  }, [lessonId])

  const handleSave = useCallback(async () => {
    setSaving(true)

    const formData = new FormData()
    formData.set("title", title)
    formData.set("description", description)
    formData.set("content", content)
    formData.set("isFreePreview", isFreePreview.toString())

    const result = await updateLesson(lessonId, formData)
    if (result.success && result.lesson) {
      setLesson(result.lesson as Lesson)
    }

    setSaving(false)
  }, [lessonId, title, description, content, isFreePreview])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sola-gold"></div>
      </div>
    )
  }

  if (!lesson || !module) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">Lesson not found</p>
        <Link href={`/dashboard/courses/${courseId}`} className="text-sola-gold mt-4 inline-block">
          Back to course
        </Link>
      </div>
    )
  }

  const Icon = typeIcons[lesson.type]

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/dashboard/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {module.course.title}
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-sola-gold" />
            </div>
            <div>
              <p className="text-white/40 text-sm">{module.title}</p>
              <h1 className="font-display text-2xl text-white uppercase tracking-tight">
                {title || lesson.title}
              </h1>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Lesson Details */}
        <div className="bg-white/5 border border-white/10 p-6 space-y-4">
          <h2 className="font-display text-lg text-white uppercase tracking-wide">
            Lesson Details
          </h2>

          <div>
            <label className="block text-white/60 text-sm mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-sola-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none resize-none"
              placeholder="Brief description of what students will learn..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFreePreview(!isFreePreview)}
              className={`flex items-center gap-2 px-4 py-2 border transition-colors ${
                isFreePreview
                  ? "border-sola-gold bg-sola-gold/10 text-sola-gold"
                  : "border-white/20 text-white/60 hover:border-white/40"
              }`}
            >
              {isFreePreview ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              {isFreePreview ? "Free Preview Enabled" : "Paid Content Only"}
            </button>
          </div>
        </div>

        {/* Video Upload (for VIDEO type) */}
        {lesson.type === "VIDEO" && (
          <div className="bg-white/5 border border-white/10 p-6">
            <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4">
              Video Content
            </h2>
            <VideoUploader
              lessonId={lessonId}
              currentPlaybackId={lesson.muxPlaybackId}
              onUploadComplete={() => {
                // Refresh lesson data
                window.location.reload()
              }}
            />
            {lesson.videoDuration && (
              <p className="text-white/40 text-sm mt-4">
                Duration: {Math.floor(lesson.videoDuration / 60)}:{(lesson.videoDuration % 60).toString().padStart(2, "0")}
              </p>
            )}
          </div>
        )}

        {/* Text Content (for TEXT type) */}
        {lesson.type === "TEXT" && (
          <div className="bg-white/5 border border-white/10 p-6">
            <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4">
              Text Content
            </h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none resize-none font-mono text-sm"
              placeholder="Write your lesson content here... (Markdown supported)"
            />
            <p className="text-white/30 text-xs mt-2">
              Supports Markdown formatting
            </p>
          </div>
        )}

        {/* Quiz/Assignment placeholder */}
        {(lesson.type === "QUIZ" || lesson.type === "ASSIGNMENT") && (
          <div className="bg-white/5 border border-white/10 p-6 text-center py-12">
            <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4">
              {typeLabels[lesson.type]} Builder
            </h2>
            <p className="text-white/40">
              Quiz and assignment builder coming soon
            </p>
          </div>
        )}

        {/* Download placeholder */}
        {lesson.type === "DOWNLOAD" && (
          <div className="bg-white/5 border border-white/10 p-6 text-center py-12">
            <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4">
              Download Files
            </h2>
            <p className="text-white/40">
              File upload coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
