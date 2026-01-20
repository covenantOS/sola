"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2 } from "lucide-react"

type Course = {
  id: string
  title: string
  slug: string
}

interface AddDomainFormProps {
  courses: Course[]
}

export function AddDomainForm({ courses }: AddDomainFormProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [domain, setDomain] = useState("")
  const [targetType, setTargetType] = useState<"COMMUNITY" | "COURSE">("COMMUNITY")
  const [targetId, setTargetId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!domain.trim()) return

    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domain.trim().toLowerCase(),
          targetType,
          targetId: targetType === "COURSE" ? targetId : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to add domain")
        setIsLoading(false)
        return
      }

      setDomain("")
      setTargetType("COMMUNITY")
      setTargetId("")
      setIsOpen(false)
      router.refresh()
    } catch {
      setError("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 bg-sola-gold text-sola-black px-4 py-2 font-display font-semibold uppercase tracking-widest text-xs"
      >
        <Plus className="h-4 w-4" />
        Add Custom Domain
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 p-4 space-y-4">
      <div>
        <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
          Domain
        </label>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="community.yourdomain.com"
          className="w-full bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
          Points To
        </label>
        <select
          value={targetType}
          onChange={(e) => setTargetType(e.target.value as "COMMUNITY" | "COURSE")}
          className="w-full bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-sola-gold focus:outline-none"
        >
          <option value="COMMUNITY">Community Page</option>
          <option value="COURSE">Specific Course</option>
        </select>
      </div>

      {targetType === "COURSE" && (
        <div>
          <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
            Select Course
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-sola-gold focus:outline-none"
            required
          >
            <option value="">Choose a course...</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 bg-sola-gold text-sola-black px-4 py-2 font-display font-semibold uppercase tracking-widest text-xs disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {isLoading ? "Adding..." : "Add Domain"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 text-white/60 hover:text-white transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
