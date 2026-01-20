"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  Building2,
  Palette,
  CreditCard,
  Users,
  Target,
  Rocket,
  Church,
  Mic,
  BookOpen,
  Video,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { completeOnboarding } from "@/app/actions/onboarding"

interface OnboardingWizardProps {
  userName?: string
  userEmail?: string
  userId: string
}

type UseCase = "church" | "creator" | "coach" | "ministry" | "nonprofit" | "other"
type Feature = "community" | "courses" | "livestreams" | "messaging"

interface OnboardingData {
  // Step 1: Welcome (no data)
  // Step 2: About You
  displayName: string
  bio: string
  // Step 3: Organization
  organizationName: string
  organizationDescription: string
  useCase: UseCase | null
  // Step 4: Features
  features: Feature[]
  // Step 5: Branding
  primaryColor: string
  // Step 6: Stripe (handled separately)
  skipStripe: boolean
  // Step 7: Community
  communityName: string
  defaultChannels: string[]
}

const STEPS = [
  { id: "welcome", title: "Welcome", icon: Sparkles },
  { id: "about", title: "About You", icon: Building2 },
  { id: "organization", title: "Organization", icon: Church },
  { id: "features", title: "Features", icon: Target },
  { id: "branding", title: "Branding", icon: Palette },
  { id: "payments", title: "Payments", icon: CreditCard },
  { id: "community", title: "Community", icon: Users },
  { id: "complete", title: "Complete", icon: Rocket },
]

const USE_CASES: { value: UseCase; label: string; icon: React.ElementType; description: string }[] = [
  { value: "church", label: "Church", icon: Church, description: "Build a digital community for your congregation" },
  { value: "creator", label: "Content Creator", icon: Mic, description: "Monetize your content and build your audience" },
  { value: "coach", label: "Coach / Consultant", icon: BookOpen, description: "Deliver courses and coaching programs" },
  { value: "ministry", label: "Ministry", icon: Sparkles, description: "Expand your ministry's reach online" },
  { value: "nonprofit", label: "Nonprofit", icon: Users, description: "Engage supporters and raise funds" },
  { value: "other", label: "Other", icon: Target, description: "Something else entirely" },
]

const FEATURES: { value: Feature; label: string; icon: React.ElementType; description: string }[] = [
  { value: "community", label: "Community", icon: Users, description: "Discussion channels, posts, and member interactions" },
  { value: "courses", label: "Courses", icon: BookOpen, description: "Video courses with modules and progress tracking" },
  { value: "livestreams", label: "Livestreams", icon: Video, description: "Live video broadcasts and recordings" },
  { value: "messaging", label: "Direct Messages", icon: MessageSquare, description: "Private messaging between members" },
]

const COLORS = [
  { value: "#D4A84B", label: "Gold" },
  { value: "#ED1C24", label: "Red" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Green" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EC4899", label: "Pink" },
  { value: "#6366F1", label: "Indigo" },
]

const DEFAULT_CHANNELS = [
  { value: "announcements", label: "Announcements" },
  { value: "general", label: "General Discussion" },
  { value: "prayer", label: "Prayer Requests" },
  { value: "introductions", label: "Introductions" },
  { value: "resources", label: "Resources" },
]

export function OnboardingWizard({ userName, userEmail, userId }: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [data, setData] = useState<OnboardingData>({
    displayName: userName || "",
    bio: "",
    organizationName: "",
    organizationDescription: "",
    useCase: null,
    features: ["community"],
    primaryColor: "#D4A84B",
    skipStripe: false,
    communityName: "General",
    defaultChannels: ["announcements", "general"],
  })

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }, [])

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0: // Welcome
        return true
      case 1: // About
        return data.displayName.trim().length >= 2
      case 2: // Organization
        return data.organizationName.trim().length >= 2 && data.useCase !== null
      case 3: // Features
        return data.features.length > 0
      case 4: // Branding
        return true
      case 5: // Payments
        return true
      case 6: // Community
        return data.communityName.trim().length >= 2
      case 7: // Complete
        return true
      default:
        return false
    }
  }, [currentStep, data])

  const handleNext = () => {
    if (canProceed() && currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
      setError(null)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      setError(null)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await completeOnboarding({
        userId,
        displayName: data.displayName,
        bio: data.bio,
        organizationName: data.organizationName,
        organizationDescription: data.organizationDescription,
        useCase: data.useCase!,
        features: data.features,
        primaryColor: data.primaryColor,
        communityName: data.communityName,
        defaultChannels: data.defaultChannels,
      })

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      // Redirect to dashboard with tour param
      router.push("/dashboard?tour=true")
      router.refresh()
    } catch (err) {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  const handleConnectStripe = async () => {
    // This will be handled by the existing Stripe connect flow
    // For now, we'll just move to the next step
    handleNext()
  }

  return (
    <div className="min-h-screen bg-sola-black">
      {/* Red accent line at top */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-sola-red z-[60]" />

      {/* Progress bar */}
      <div className="fixed top-1 left-0 right-0 h-1 bg-white/10 z-50">
        <div
          className="h-full bg-sola-gold transition-all duration-500"
          style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar - Step indicator */}
        <div className="hidden lg:flex w-80 bg-sola-dark-navy border-r border-white/10 flex-col pt-16">
          <div className="p-6">
            <Image
              src="/logo-dark.svg"
              alt="Sola+"
              width={120}
              height={24}
              className="h-8 w-auto mb-8"
            />
          </div>
          <nav className="flex-1 px-4">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 mb-1 transition-all duration-200",
                  index === currentStep && "bg-white/5 border-l-2 border-sola-gold",
                  index < currentStep && "text-sola-gold",
                  index > currentStep && "text-white/30"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm",
                    index === currentStep && "bg-sola-gold text-sola-black",
                    index < currentStep && "bg-sola-gold/20 text-sola-gold",
                    index > currentStep && "bg-white/10 text-white/30"
                  )}
                >
                  {index < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span className="font-display text-sm uppercase tracking-wide">
                  {step.title}
                </span>
              </div>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col pt-16">
          {/* Mobile progress */}
          <div className="lg:hidden p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">
                Step {currentStep + 1} of {STEPS.length}
              </span>
              <span className="font-display text-white uppercase tracking-wide text-sm">
                {STEPS[currentStep].title}
              </span>
            </div>
          </div>

          {/* Step content */}
          <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
            <div className="w-full max-w-2xl">
              {/* Step 0: Welcome */}
              {currentStep === 0 && (
                <WelcomeStep userName={userName} onNext={handleNext} />
              )}

              {/* Step 1: About You */}
              {currentStep === 1 && (
                <AboutStep
                  data={data}
                  updateData={updateData}
                  userEmail={userEmail}
                />
              )}

              {/* Step 2: Organization */}
              {currentStep === 2 && (
                <OrganizationStep data={data} updateData={updateData} />
              )}

              {/* Step 3: Features */}
              {currentStep === 3 && (
                <FeaturesStep data={data} updateData={updateData} />
              )}

              {/* Step 4: Branding */}
              {currentStep === 4 && (
                <BrandingStep data={data} updateData={updateData} />
              )}

              {/* Step 5: Payments */}
              {currentStep === 5 && (
                <PaymentsStep
                  data={data}
                  updateData={updateData}
                  onConnectStripe={handleConnectStripe}
                />
              )}

              {/* Step 6: Community */}
              {currentStep === 6 && (
                <CommunityStep data={data} updateData={updateData} />
              )}

              {/* Step 7: Complete */}
              {currentStep === 7 && (
                <CompleteStep data={data} />
              )}

              {/* Error message */}
              {error && (
                <div className="mt-6 p-4 bg-sola-red/10 border border-sola-red/30 text-sola-red text-sm">
                  {error}
                </div>
              )}

              {/* Navigation buttons */}
              {currentStep > 0 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                  <button
                    onClick={handleBack}
                    disabled={isLoading}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>

                  {currentStep < STEPS.length - 1 ? (
                    <button
                      onClick={handleNext}
                      disabled={!canProceed() || isLoading}
                      className="flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleComplete}
                      disabled={isLoading}
                      className="flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Launch My Platform
                          <Rocket className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step Components

function WelcomeStep({ userName, onNext }: { userName?: string; onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-sola-gold/10 flex items-center justify-center mx-auto mb-8">
        <Sparkles className="h-10 w-10 text-sola-gold" />
      </div>
      <h1 className="font-display text-4xl md:text-5xl text-white uppercase tracking-tight mb-4">
        Welcome{userName ? `, ${userName}` : ""}!
      </h1>
      <p className="text-white/60 text-lg mb-8 max-w-md mx-auto">
        Let&apos;s set up your creator platform in just a few minutes. We&apos;ll guide you through everything.
      </p>
      <div className="space-y-4 text-left max-w-sm mx-auto mb-8">
        {[
          "Create your organization profile",
          "Choose your features",
          "Customize your branding",
          "Set up payments",
          "Launch your community",
        ].map((item, index) => (
          <div key={index} className="flex items-center gap-3 text-white/80">
            <div className="w-6 h-6 bg-sola-gold/20 flex items-center justify-center text-xs text-sola-gold">
              {index + 1}
            </div>
            {item}
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-8 py-4 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
      >
        Get Started
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function AboutStep({
  data,
  updateData,
  userEmail,
}: {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  userEmail?: string
}) {
  return (
    <div>
      <h2 className="font-display text-3xl text-white uppercase tracking-tight mb-2">
        Tell us about yourself
      </h2>
      <p className="text-white/60 mb-8">
        This information will be visible to your members.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
            Display Name *
          </label>
          <input
            type="text"
            value={data.displayName}
            onChange={(e) => updateData({ displayName: e.target.value })}
            placeholder="Pastor John Smith"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
          />
        </div>

        {userEmail && (
          <div>
            <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
              Email
            </label>
            <input
              type="email"
              value={userEmail}
              disabled
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white/60 cursor-not-allowed"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
            Bio <span className="text-white/40 normal-case">(optional)</span>
          </label>
          <textarea
            value={data.bio}
            onChange={(e) => updateData({ bio: e.target.value })}
            rows={3}
            placeholder="Tell your members a bit about yourself..."
            className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  )
}

function OrganizationStep({
  data,
  updateData,
}: {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}) {
  return (
    <div>
      <h2 className="font-display text-3xl text-white uppercase tracking-tight mb-2">
        Your Organization
      </h2>
      <p className="text-white/60 mb-8">
        This will be your home on Sola+. You can always change this later.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
            Organization Name *
          </label>
          <input
            type="text"
            value={data.organizationName}
            onChange={(e) => updateData({ organizationName: e.target.value })}
            placeholder="Grace Community Church"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
            Description <span className="text-white/40 normal-case">(optional)</span>
          </label>
          <textarea
            value={data.organizationDescription}
            onChange={(e) => updateData({ organizationDescription: e.target.value })}
            rows={2}
            placeholder="A brief description of your organization..."
            className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-4">
            What best describes you? *
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            {USE_CASES.map((useCase) => (
              <button
                key={useCase.value}
                onClick={() => updateData({ useCase: useCase.value })}
                className={cn(
                  "flex items-start gap-3 p-4 border text-left transition-all duration-200",
                  data.useCase === useCase.value
                    ? "bg-sola-gold/10 border-sola-gold"
                    : "bg-white/5 border-white/10 hover:border-white/30"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 flex items-center justify-center flex-shrink-0",
                    data.useCase === useCase.value
                      ? "bg-sola-gold/20 text-sola-gold"
                      : "bg-white/10 text-white/60"
                  )}
                >
                  <useCase.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-white uppercase tracking-wide text-sm">
                    {useCase.label}
                  </p>
                  <p className="text-white/50 text-xs mt-1">{useCase.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturesStep({
  data,
  updateData,
}: {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}) {
  const toggleFeature = (feature: Feature) => {
    const newFeatures = data.features.includes(feature)
      ? data.features.filter((f) => f !== feature)
      : [...data.features, feature]
    updateData({ features: newFeatures })
  }

  return (
    <div>
      <h2 className="font-display text-3xl text-white uppercase tracking-tight mb-2">
        Choose Your Features
      </h2>
      <p className="text-white/60 mb-8">
        Select what you want to offer your members. You can enable more later.
      </p>

      <div className="space-y-3">
        {FEATURES.map((feature) => (
          <button
            key={feature.value}
            onClick={() => toggleFeature(feature.value)}
            className={cn(
              "w-full flex items-center gap-4 p-4 border text-left transition-all duration-200",
              data.features.includes(feature.value)
                ? "bg-sola-gold/10 border-sola-gold"
                : "bg-white/5 border-white/10 hover:border-white/30"
            )}
          >
            <div
              className={cn(
                "w-12 h-12 flex items-center justify-center flex-shrink-0",
                data.features.includes(feature.value)
                  ? "bg-sola-gold/20 text-sola-gold"
                  : "bg-white/10 text-white/60"
              )}
            >
              <feature.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-display text-white uppercase tracking-wide">
                {feature.label}
              </p>
              <p className="text-white/50 text-sm mt-1">{feature.description}</p>
            </div>
            <div
              className={cn(
                "w-6 h-6 border-2 flex items-center justify-center",
                data.features.includes(feature.value)
                  ? "bg-sola-gold border-sola-gold"
                  : "border-white/30"
              )}
            >
              {data.features.includes(feature.value) && (
                <Check className="h-4 w-4 text-sola-black" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function BrandingStep({
  data,
  updateData,
}: {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}) {
  return (
    <div>
      <h2 className="font-display text-3xl text-white uppercase tracking-tight mb-2">
        Customize Your Brand
      </h2>
      <p className="text-white/60 mb-8">
        Choose a primary color for your platform. You can customize more later.
      </p>

      <div>
        <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-4">
          Primary Color
        </label>
        <div className="grid grid-cols-4 gap-3">
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => updateData({ primaryColor: color.value })}
              className={cn(
                "aspect-square border-2 transition-all duration-200 relative",
                data.primaryColor === color.value
                  ? "border-white scale-110"
                  : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: color.value }}
            >
              {data.primaryColor === color.value && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Check className="h-6 w-6 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-white/40 text-sm mt-4">
          Selected: {COLORS.find((c) => c.value === data.primaryColor)?.label}
        </p>
      </div>

      {/* Preview */}
      <div className="mt-8 p-6 bg-white/5 border border-white/10">
        <p className="text-white/60 text-sm mb-4">Preview</p>
        <div className="flex items-center gap-4">
          <button
            className="px-6 py-3 font-display font-semibold uppercase tracking-widest text-sm text-sola-black"
            style={{ backgroundColor: data.primaryColor }}
          >
            Sample Button
          </button>
          <span style={{ color: data.primaryColor }}>Accent Text</span>
        </div>
      </div>
    </div>
  )
}

function PaymentsStep({
  data,
  updateData,
  onConnectStripe,
}: {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onConnectStripe: () => void
}) {
  return (
    <div>
      <h2 className="font-display text-3xl text-white uppercase tracking-tight mb-2">
        Accept Payments
      </h2>
      <p className="text-white/60 mb-8">
        Connect Stripe to accept membership payments, sell courses, and receive donations.
      </p>

      <div className="space-y-4">
        <div className="p-6 bg-white/5 border border-white/10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-sola-gold/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="h-6 w-6 text-sola-gold" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-white uppercase tracking-wide mb-2">
                Stripe Connect
              </h3>
              <ul className="text-white/60 text-sm space-y-1 mb-4">
                <li>• Accept credit cards and bank transfers</li>
                <li>• Automatic payouts to your bank account</li>
                <li>• No platform fees — 100% yours (only Stripe fees)</li>
                <li>• No monthly fees or hidden charges</li>
              </ul>
              <button
                onClick={onConnectStripe}
                className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
              >
                Connect Stripe
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            updateData({ skipStripe: true })
            onConnectStripe()
          }}
          className="w-full p-4 text-white/40 hover:text-white/60 text-sm transition-colors"
        >
          Skip for now - I&apos;ll set this up later
        </button>
      </div>
    </div>
  )
}

function CommunityStep({
  data,
  updateData,
}: {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}) {
  const toggleChannel = (channel: string) => {
    const newChannels = data.defaultChannels.includes(channel)
      ? data.defaultChannels.filter((c) => c !== channel)
      : [...data.defaultChannels, channel]
    updateData({ defaultChannels: newChannels })
  }

  return (
    <div>
      <h2 className="font-display text-3xl text-white uppercase tracking-tight mb-2">
        Set Up Your Community
      </h2>
      <p className="text-white/60 mb-8">
        Create your first community and choose which channels to include.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
            Community Name *
          </label>
          <input
            type="text"
            value={data.communityName}
            onChange={(e) => updateData({ communityName: e.target.value })}
            placeholder="General"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-4">
            Default Channels
          </label>
          <div className="space-y-2">
            {DEFAULT_CHANNELS.map((channel) => (
              <button
                key={channel.value}
                onClick={() => toggleChannel(channel.value)}
                className={cn(
                  "w-full flex items-center justify-between p-3 border text-left transition-all duration-200",
                  data.defaultChannels.includes(channel.value)
                    ? "bg-sola-gold/10 border-sola-gold"
                    : "bg-white/5 border-white/10 hover:border-white/30"
                )}
              >
                <span className="text-white">{channel.label}</span>
                <div
                  className={cn(
                    "w-5 h-5 border flex items-center justify-center",
                    data.defaultChannels.includes(channel.value)
                      ? "bg-sola-gold border-sola-gold"
                      : "border-white/30"
                  )}
                >
                  {data.defaultChannels.includes(channel.value) && (
                    <Check className="h-3 w-3 text-sola-black" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CompleteStep({ data }: { data: OnboardingData }) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-sola-gold/10 flex items-center justify-center mx-auto mb-8">
        <Rocket className="h-10 w-10 text-sola-gold" />
      </div>
      <h2 className="font-display text-4xl text-white uppercase tracking-tight mb-4">
        You&apos;re All Set!
      </h2>
      <p className="text-white/60 text-lg mb-8 max-w-md mx-auto">
        Your platform is ready to launch. Here&apos;s a summary of what we&apos;ve set up for you.
      </p>

      <div className="bg-white/5 border border-white/10 p-6 text-left space-y-4 max-w-md mx-auto">
        <div className="flex justify-between">
          <span className="text-white/60">Organization</span>
          <span className="text-white font-display">{data.organizationName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Community</span>
          <span className="text-white font-display">{data.communityName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Channels</span>
          <span className="text-white">{data.defaultChannels.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Features</span>
          <span className="text-white">{data.features.length} enabled</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/60">Primary Color</span>
          <div
            className="w-6 h-6"
            style={{ backgroundColor: data.primaryColor }}
          />
        </div>
      </div>

      <p className="text-white/40 text-sm mt-8">
        Click &quot;Launch My Platform&quot; to complete setup and start a guided tour.
      </p>
    </div>
  )
}
