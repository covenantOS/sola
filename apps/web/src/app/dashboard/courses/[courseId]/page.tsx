"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  FileText,
  HelpCircle,
  ClipboardList,
  Download,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  GripVertical,
  Users,
  Save,
  MoreVertical,
} from "lucide-react"
import {
  getCourse,
  updateCourse,
  deleteCourse,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
} from "@/app/actions/course"

type Lesson = {
  id: string
  title: string
  description: string | null
  type: "VIDEO" | "TEXT" | "QUIZ" | "ASSIGNMENT" | "DOWNLOAD"
  position: number
  isFreePreview: boolean
  muxPlaybackId: string | null
  videoDuration: number | null
}

type Module = {
  id: string
  title: string
  position: number
  lessons: Lesson[]
}

type Course = {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  price: number | null
  isPublished: boolean
  modules: Module[]
  _count: {
    enrollments: number
  }
}

const lessonTypeIcons: Record<string, typeof PlayCircle> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
  DOWNLOAD: Download,
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // Edit states
  const [editingCourse, setEditingCourse] = useState(false)
  const [newModuleName, setNewModuleName] = useState("")
  const [showNewModule, setShowNewModule] = useState(false)
  const [addingLessonTo, setAddingLessonTo] = useState<string | null>(null)
  const [newLessonName, setNewLessonName] = useState("")
  const [newLessonType, setNewLessonType] = useState<string>("VIDEO")

  // Load course
  useEffect(() => {
    async function loadCourse() {
      const result = await getCourse(courseId)
      if (result.course) {
        // Convert Prisma Decimal to number for price
        const courseData = {
          ...result.course,
          price: result.course.price ? Number(result.course.price) : null,
        } as Course
        setCourse(courseData)
        // Expand all modules by default
        setExpandedModules(new Set(result.course.modules.map((m: Module) => m.id)))
      }
      setLoading(false)
    }
    loadCourse()
  }, [courseId])

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  const handleUpdateCourse = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    const formData = new FormData(e.currentTarget)
    formData.set("isPublished", course?.isPublished ? "true" : "false")

    const result = await updateCourse(courseId, formData)
    if (result.course) {
      setCourse(prev => prev ? {
        ...prev,
        title: result.course.title,
        description: result.course.description,
        price: result.course.price ? Number(result.course.price) : null,
        isPublished: result.course.isPublished,
      } : null)
      setEditingCourse(false)
    }
    setSaving(false)
  }, [courseId, course?.isPublished])

  const handleTogglePublish = useCallback(async () => {
    if (!course) return
    setSaving(true)

    const formData = new FormData()
    formData.set("title", course.title)
    formData.set("isPublished", course.isPublished ? "false" : "true")

    const result = await updateCourse(courseId, formData)
    if (result.course) {
      setCourse(prev => prev ? { ...prev, isPublished: !prev.isPublished } : null)
    }
    setSaving(false)
  }, [courseId, course])

  const handleDeleteCourse = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this course? This cannot be undone.")) return

    const result = await deleteCourse(courseId)
    if (result.success) {
      router.push("/dashboard/courses")
    }
  }, [courseId, router])

  const handleCreateModule = useCallback(async () => {
    if (!newModuleName.trim()) return
    setSaving(true)

    const formData = new FormData()
    formData.set("courseId", courseId)
    formData.set("title", newModuleName)

    const result = await createModule(formData)
    if (result.module) {
      setCourse(prev => prev ? {
        ...prev,
        modules: [...prev.modules, { ...result.module, lessons: [] } as Module]
      } : null)
      setNewModuleName("")
      setShowNewModule(false)
      setExpandedModules(prev => new Set([...prev, result.module.id]))
    }
    setSaving(false)
  }, [courseId, newModuleName])

  const handleDeleteModule = useCallback(async (moduleId: string) => {
    if (!confirm("Delete this module and all its lessons?")) return

    const result = await deleteModule(moduleId)
    if (result.success) {
      setCourse(prev => prev ? {
        ...prev,
        modules: prev.modules.filter(m => m.id !== moduleId)
      } : null)
    }
  }, [])

  const handleCreateLesson = useCallback(async (moduleId: string) => {
    if (!newLessonName.trim()) return
    setSaving(true)

    const formData = new FormData()
    formData.set("moduleId", moduleId)
    formData.set("title", newLessonName)
    formData.set("type", newLessonType)

    const result = await createLesson(formData)
    if (result.lesson) {
      setCourse(prev => {
        if (!prev) return null
        return {
          ...prev,
          modules: prev.modules.map(m =>
            m.id === moduleId
              ? { ...m, lessons: [...m.lessons, result.lesson as Lesson] }
              : m
          )
        }
      })
      setNewLessonName("")
      setNewLessonType("VIDEO")
      setAddingLessonTo(null)
    }
    setSaving(false)
  }, [newLessonName, newLessonType])

  const handleDeleteLesson = useCallback(async (lessonId: string, moduleId: string) => {
    if (!confirm("Delete this lesson?")) return

    const result = await deleteLesson(lessonId)
    if (result.success) {
      setCourse(prev => {
        if (!prev) return null
        return {
          ...prev,
          modules: prev.modules.map(m =>
            m.id === moduleId
              ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
              : m
          )
        }
      })
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sola-gold"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">Course not found</p>
        <Link href="/dashboard/courses" className="text-sola-gold mt-4 inline-block">
          Back to courses
        </Link>
      </div>
    )
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/courses"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>

          {editingCourse ? (
            <form onSubmit={handleUpdateCourse} className="space-y-4">
              <input
                type="text"
                name="title"
                defaultValue={course.title}
                className="text-3xl font-display text-white uppercase tracking-tight bg-transparent border-b border-white/20 focus:border-sola-gold focus:outline-none w-full"
              />
              <textarea
                name="description"
                defaultValue={course.description || ""}
                placeholder="Course description..."
                className="w-full bg-white/5 border border-white/10 p-3 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none resize-none"
                rows={2}
              />
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  name="price"
                  defaultValue={course.price || ""}
                  placeholder="Price (leave empty for free)"
                  step="0.01"
                  className="bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none w-40"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-4 py-2 text-xs"
                >
                  <Save className="h-3 w-3" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCourse(false)}
                  className="text-white/60 hover:text-white text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="font-display text-3xl md:text-4xl text-white uppercase tracking-tight">
                {course.title}
              </h2>
              {course.description && (
                <p className="text-white/60 mt-2 max-w-2xl">{course.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-white/40">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {course.modules.length} modules
                </span>
                <span className="flex items-center gap-1">
                  <PlayCircle className="h-4 w-4" />
                  {totalLessons} lessons
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course._count.enrollments} enrolled
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditingCourse(!editingCourse)}
            className="p-2 text-white/60 hover:text-white transition-colors"
          >
            <Edit2 className="h-5 w-5" />
          </button>
          <button
            onClick={handleTogglePublish}
            disabled={saving}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-display uppercase tracking-widest transition-all ${
              course.isPublished
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            {course.isPublished ? (
              <>
                <Eye className="h-3 w-3" />
                Published
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3" />
                Draft
              </>
            )}
          </button>
          <button
            onClick={handleDeleteCourse}
            className="p-2 text-white/60 hover:text-sola-red transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Modules & Lessons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-white uppercase tracking-wide">
            Course Content
          </h3>
          <button
            onClick={() => setShowNewModule(!showNewModule)}
            className="inline-flex items-center gap-2 text-sola-gold hover:text-sola-gold/80 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Module
          </button>
        </div>

        {/* New Module Form */}
        {showNewModule && (
          <div className="bg-white/5 border border-white/10 p-4 flex items-center gap-4">
            <input
              type="text"
              placeholder="Module title"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleCreateModule}
              disabled={saving || !newModuleName.trim()}
              className="bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-4 py-2 text-xs disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add"}
            </button>
            <button
              onClick={() => {
                setShowNewModule(false)
                setNewModuleName("")
              }}
              className="text-white/60 hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Module List */}
        {course.modules.length === 0 ? (
          <div className="bg-white/5 border border-white/10 p-8 text-center">
            <BookOpen className="h-12 w-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40">No modules yet. Add your first module to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {course.modules.map((module, moduleIndex) => (
              <div key={module.id} className="bg-white/5 border border-white/10">
                {/* Module Header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02]"
                  onClick={() => toggleModule(module.id)}
                >
                  <GripVertical className="h-4 w-4 text-white/20" />
                  {expandedModules.has(module.id) ? (
                    <ChevronDown className="h-4 w-4 text-white/40" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-white/40" />
                  )}
                  <span className="text-white/40 text-sm font-display">{moduleIndex + 1}.</span>
                  <span className="font-display text-white uppercase tracking-wide flex-1">
                    {module.title}
                  </span>
                  <span className="text-white/40 text-sm">
                    {module.lessons.length} lessons
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteModule(module.id)
                    }}
                    className="p-1 text-white/30 hover:text-sola-red transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Lessons */}
                {expandedModules.has(module.id) && (
                  <div className="border-t border-white/5">
                    {module.lessons.length === 0 ? (
                      <div className="p-4 text-center text-white/30 text-sm">
                        No lessons in this module
                      </div>
                    ) : (
                      module.lessons.map((lesson, lessonIndex) => {
                        const Icon = lessonTypeIcons[lesson.type]
                        return (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 px-4 py-3 pl-16 hover:bg-white/[0.02] border-t border-white/5 first:border-t-0"
                          >
                            <Icon className="h-4 w-4 text-white/40" />
                            <span className="text-white/40 text-sm">{moduleIndex + 1}.{lessonIndex + 1}</span>
                            <span className="text-white/80 flex-1">{lesson.title}</span>
                            {lesson.videoDuration && (
                              <span className="text-white/30 text-xs">
                                {Math.round(lesson.videoDuration / 60)}min
                              </span>
                            )}
                            {lesson.isFreePreview && (
                              <span className="text-xs px-2 py-0.5 bg-sola-gold/20 text-sola-gold">
                                Free Preview
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteLesson(lesson.id, module.id)}
                              className="p-1 text-white/30 hover:text-sola-red transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )
                      })
                    )}

                    {/* Add Lesson */}
                    {addingLessonTo === module.id ? (
                      <div className="p-4 pl-16 border-t border-white/5 flex items-center gap-4">
                        <input
                          type="text"
                          placeholder="Lesson title"
                          value={newLessonName}
                          onChange={(e) => setNewLessonName(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-white text-sm placeholder:text-white/30 focus:border-sola-gold focus:outline-none"
                          autoFocus
                        />
                        <select
                          value={newLessonType}
                          onChange={(e) => setNewLessonType(e.target.value)}
                          className="bg-white/5 border border-white/10 px-3 py-2 text-white text-sm focus:border-sola-gold focus:outline-none"
                        >
                          <option value="VIDEO">Video</option>
                          <option value="TEXT">Text</option>
                          <option value="QUIZ">Quiz</option>
                          <option value="ASSIGNMENT">Assignment</option>
                        </select>
                        <button
                          onClick={() => handleCreateLesson(module.id)}
                          disabled={saving || !newLessonName.trim()}
                          className="bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-3 py-2 text-xs disabled:opacity-50"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setAddingLessonTo(null)
                            setNewLessonName("")
                          }}
                          className="text-white/60 hover:text-white text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingLessonTo(module.id)}
                        className="w-full p-3 pl-16 border-t border-white/5 text-left text-white/40 hover:text-sola-gold hover:bg-white/[0.02] transition-colors text-sm flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Lesson
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
