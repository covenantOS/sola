"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { dismissTour } from "@/app/actions/onboarding"

interface TourStep {
  id: string
  title: string
  description: string
  target: string // CSS selector
  position: "top" | "bottom" | "left" | "right"
  route?: string // Navigate to this route before showing
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Your Dashboard!",
    description: "This is your command center. Here you'll see key stats and quick actions to manage your platform.",
    target: "[data-tour='dashboard-welcome']",
    position: "bottom",
    route: "/dashboard",
  },
  {
    id: "stats",
    title: "Your Stats at a Glance",
    description: "Track your members, courses, livestreams, and payment status. These update in real-time as your community grows.",
    target: "[data-tour='dashboard-stats']",
    position: "bottom",
    route: "/dashboard",
  },
  {
    id: "sidebar",
    title: "Navigation Menu",
    description: "Access all areas of your platform from here: Community, Courses, Livestreams, Messages, Analytics, Payments, and Settings.",
    target: "[data-tour='sidebar-nav']",
    position: "right",
    route: "/dashboard",
  },
  {
    id: "community",
    title: "Your Community Hub",
    description: "This is where your members connect. Create channels for discussions, announcements, prayer requests, and more.",
    target: "[data-tour='community-header']",
    position: "bottom",
    route: "/dashboard/community",
  },
  {
    id: "courses",
    title: "Course Builder",
    description: "Create and manage video courses. Upload content, organize lessons, and track student progress.",
    target: "[data-tour='courses-header']",
    position: "bottom",
    route: "/dashboard/courses",
  },
  {
    id: "settings",
    title: "Settings & Payments",
    description: "Configure your organization, connect Stripe for payments, customize branding, and manage your account.",
    target: "[data-tour='settings-header']",
    position: "bottom",
    route: "/dashboard/settings",
  },
]

interface GuidedTourProps {
  userId: string
  showTour: boolean
}

export function GuidedTour({ userId, showTour }: GuidedTourProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [isNavigating, setIsNavigating] = useState(false)

  const currentStep = TOUR_STEPS[currentStepIndex]
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1

  // Check if tour should start
  useEffect(() => {
    const tourParam = searchParams.get("tour")
    if (tourParam === "true" || showTour) {
      setIsVisible(true)
    }
  }, [searchParams, showTour])

  // Position the tooltip relative to the target element
  const positionTooltip = useCallback(() => {
    if (!currentStep) return

    const target = document.querySelector(currentStep.target)
    if (!target) {
      // Target not found, might need to navigate
      return
    }

    const rect = target.getBoundingClientRect()
    const scrollTop = window.scrollY
    const scrollLeft = window.scrollX
    const tooltipWidth = 320
    const tooltipHeight = 200
    const padding = 16

    let top = 0
    let left = 0

    switch (currentStep.position) {
      case "top":
        top = rect.top + scrollTop - tooltipHeight - padding
        left = rect.left + scrollLeft + rect.width / 2 - tooltipWidth / 2
        break
      case "bottom":
        top = rect.bottom + scrollTop + padding
        left = rect.left + scrollLeft + rect.width / 2 - tooltipWidth / 2
        break
      case "left":
        top = rect.top + scrollTop + rect.height / 2 - tooltipHeight / 2
        left = rect.left + scrollLeft - tooltipWidth - padding
        break
      case "right":
        top = rect.top + scrollTop + rect.height / 2 - tooltipHeight / 2
        left = rect.right + scrollLeft + padding
        break
    }

    // Keep within viewport
    const maxLeft = window.innerWidth - tooltipWidth - 20
    left = Math.max(20, Math.min(left, maxLeft))
    top = Math.max(20, top)

    setTooltipPosition({ top, left })

    // Highlight target
    target.classList.add("tour-highlight")

    return () => {
      target.classList.remove("tour-highlight")
    }
  }, [currentStep])

  // Handle navigation to step's route
  useEffect(() => {
    if (!isVisible || !currentStep) return

    if (currentStep.route && pathname !== currentStep.route) {
      setIsNavigating(true)
      router.push(currentStep.route)
    } else {
      setIsNavigating(false)
      // Small delay to let the page render
      const timer = setTimeout(positionTooltip, 100)
      return () => clearTimeout(timer)
    }
  }, [isVisible, currentStep, pathname, router, positionTooltip])

  // Reposition on window resize
  useEffect(() => {
    if (!isVisible) return
    window.addEventListener("resize", positionTooltip)
    return () => window.removeEventListener("resize", positionTooltip)
  }, [isVisible, positionTooltip])

  const handleNext = () => {
    // Remove highlight from current target
    const target = document.querySelector(currentStep.target)
    if (target) target.classList.remove("tour-highlight")

    if (isLastStep) {
      handleDismiss()
    } else {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    // Remove highlight from current target
    const target = document.querySelector(currentStep.target)
    if (target) target.classList.remove("tour-highlight")

    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const handleDismiss = async () => {
    // Remove highlight from current target
    const target = document.querySelector(currentStep?.target || "")
    if (target) target.classList.remove("tour-highlight")

    setIsVisible(false)
    await dismissTour(userId)

    // Remove tour param from URL
    const newUrl = pathname
    router.replace(newUrl)
  }

  if (!isVisible || !currentStep) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[100] pointer-events-none" />

      {/* Tooltip */}
      <div
        className="fixed z-[101] w-80 bg-sola-dark-navy border border-sola-gold shadow-2xl"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-sola-gold transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sola-gold" />
              <span className="text-white/60 text-xs">
                Step {currentStepIndex + 1} of {TOUR_STEPS.length}
              </span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          {isNavigating ? (
            <div className="py-4 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-sola-gold border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-white/60 text-sm">Loading...</p>
            </div>
          ) : (
            <>
              <h3 className="font-display text-lg text-white uppercase tracking-wide mb-2">
                {currentStep.title}
              </h3>
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                {currentStep.description}
              </p>
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0 || isNavigating}
              className={cn(
                "flex items-center gap-1 text-sm transition-colors",
                currentStepIndex === 0
                  ? "text-white/20 cursor-not-allowed"
                  : "text-white/60 hover:text-white"
              )}
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="text-white/40 hover:text-white text-sm transition-colors"
              >
                Skip Tour
              </button>
              <button
                onClick={handleNext}
                disabled={isNavigating}
                className="flex items-center gap-1 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-3 py-1.5 text-xs transition-all duration-300 hover:shadow-[0_0_10px_rgba(212,168,75,0.4)] disabled:opacity-50"
              >
                {isLastStep ? (
                  <>
                    Finish
                    <Check className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Arrow pointer */}
        <div
          className={cn(
            "absolute w-3 h-3 bg-sola-dark-navy border-sola-gold transform rotate-45",
            currentStep.position === "top" && "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-r border-b",
            currentStep.position === "bottom" && "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-t",
            currentStep.position === "left" && "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 border-t border-r",
            currentStep.position === "right" && "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-b border-l"
          )}
        />
      </div>

      {/* Global styles for tour highlight */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 100;
          box-shadow: 0 0 0 4px rgba(212, 168, 75, 0.5), 0 0 20px rgba(212, 168, 75, 0.3);
        }
      `}</style>
    </>
  )
}
