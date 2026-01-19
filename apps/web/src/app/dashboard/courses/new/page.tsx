"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BookOpen, DollarSign, FileText } from "lucide-react"
import { createCourse } from "@/app/actions/course"

export default function NewCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createCourse(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.success && result.course) {
      router.push(`/dashboard/courses/${result.course.id}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Link>
        <h2 className="font-display text-3xl md:text-4xl text-white uppercase tracking-tight">
          Create New Course
        </h2>
        <p className="text-white/60 mt-2">
          Set up your course details. You can add modules and lessons after creating.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-sola-red/10 border border-sola-red/30 p-4 text-sola-red text-sm">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm text-white/60 mb-2">
            Course Title *
          </label>
          <div className="relative">
            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
            <input
              type="text"
              name="title"
              required
              placeholder="e.g., Introduction to Prayer"
              className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-white/60 mb-2">
            Description
          </label>
          <div className="relative">
            <FileText className="absolute left-4 top-4 h-5 w-5 text-white/30" />
            <textarea
              name="description"
              placeholder="What will students learn in this course?"
              rows={4}
              className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm text-white/60 mb-2">
            Price (USD)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              placeholder="0.00 (leave empty for free)"
              className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none"
            />
          </div>
          <p className="text-xs text-white/40 mt-1">
            Leave empty to make the course free
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Course"}
          </button>
          <Link
            href="/dashboard/courses"
            className="px-6 py-3 text-white/60 hover:text-white transition-colors font-display uppercase tracking-widest text-sm"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
