import { getLogtoContext, signOut } from "@logto/next/server-actions"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import { logtoConfig } from "@/lib/logto"
import { UserButton } from "@/components/auth/user-button"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { GuidedTour } from "@/components/tour/guided-tour"
import { syncUserFromLogto, getUserWithOrganization } from "@/lib/user-sync"
import {
  Home,
  Users,
  BookOpen,
  Video,
  CreditCard,
  Settings,
  BarChart3,
  MessageSquare,
  DollarSign,
  Globe,
} from "lucide-react"

export const dynamic = "force-dynamic"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Community", href: "/dashboard/community", icon: Users },
  { name: "Courses", href: "/dashboard/courses", icon: BookOpen },
  { name: "Livestreams", href: "/dashboard/livestreams", icon: Video },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Tiers", href: "/dashboard/tiers", icon: CreditCard },
  { name: "Earnings", href: "/dashboard/earnings", icon: DollarSign },
  { name: "Domains", href: "/dashboard/domains", icon: Globe },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if required environment variables are set
  if (!process.env.LOGTO_ENDPOINT || !process.env.LOGTO_APP_ID) {
    return (
      <div className="min-h-screen bg-sola-black flex items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <h1 className="font-display text-2xl text-sola-red uppercase tracking-wide mb-4">
            Configuration Error
          </h1>
          <p className="text-white/60 mb-4">
            Missing required environment variables. Please configure Logto authentication.
          </p>
          <p className="text-white/40 text-sm">
            Required: LOGTO_ENDPOINT, LOGTO_APP_ID, LOGTO_APP_SECRET, LOGTO_COOKIE_SECRET
          </p>
        </div>
      </div>
    )
  }

  let isAuthenticated = false
  let claims: Record<string, unknown> | undefined

  try {
    const context = await getLogtoContext(logtoConfig)
    isAuthenticated = context.isAuthenticated
    claims = context.claims
  } catch (error) {
    console.error("Logto context error:", error)
    return (
      <div className="min-h-screen bg-sola-black flex items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <h1 className="font-display text-2xl text-sola-red uppercase tracking-wide mb-4">
            Authentication Error
          </h1>
          <p className="text-white/60 mb-4">
            Unable to verify authentication. Please try again.
          </p>
          <a href="/" className="text-sola-gold hover:underline">
            Return to Home
          </a>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    redirect("/")
  }

  // Sync user to database on every dashboard load
  let dbUser
  try {
    dbUser = await syncUserFromLogto({
      sub: claims?.sub as string || "",
      email: claims?.email as string | undefined,
      name: claims?.name as string | undefined,
      picture: claims?.picture as string | undefined,
    })
  } catch (error) {
    console.error("User sync error:", error)
    return (
      <div className="min-h-screen bg-sola-black flex items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <h1 className="font-display text-2xl text-sola-red uppercase tracking-wide mb-4">
            Database Error
          </h1>
          <p className="text-white/60 mb-4">
            Unable to sync user data. Please check database connection.
          </p>
          <a href="/" className="text-sola-gold hover:underline">
            Return to Home
          </a>
        </div>
      </div>
    )
  }

  // Check if user has an organization
  let organization
  try {
    const result = await getUserWithOrganization(claims?.sub as string || "")
    organization = result.organization
  } catch (error) {
    console.error("Organization lookup error:", error)
    return (
      <div className="min-h-screen bg-sola-black flex items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <h1 className="font-display text-2xl text-sola-red uppercase tracking-wide mb-4">
            Database Error
          </h1>
          <p className="text-white/60 mb-4">
            Unable to load organization data. Please check database connection.
          </p>
          <a href="/" className="text-sola-gold hover:underline">
            Return to Home
          </a>
        </div>
      </div>
    )
  }

  // If no organization, show full onboarding wizard
  if (!organization) {
    return (
      <OnboardingWizard
        userName={dbUser.name || undefined}
        userEmail={dbUser.email}
        userId={dbUser.id}
      />
    )
  }

  // Check if tour should be shown
  const orgSettings = (organization.settings as Record<string, unknown>) || {}
  const showTour = orgSettings.showTour === true

  const user = {
    sub: (claims?.sub as string) || "",
    name: claims?.name as string | undefined,
    email: claims?.email as string | undefined,
    picture: claims?.picture as string | undefined,
  }

  return (
    <div className="min-h-screen bg-sola-black">
      {/* Red accent line at top */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-sola-red z-[60]" />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-sola-dark-navy border-r border-white/10 pt-1">
        <div className="flex h-16 items-center px-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo-dark.svg"
              alt="Sola+"
              width={120}
              height={24}
              className="h-8 w-auto"
            />
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-4" data-tour="sidebar-nav">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent hover:border-sola-red transition-all duration-200"
            >
              <item.icon className="h-5 w-5" />
              <span className="font-display text-sm uppercase tracking-wide">
                {item.name}
              </span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="pl-64 pt-1">
        {/* Top bar */}
        <header className="sticky top-1 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-sola-black/95 backdrop-blur px-6">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-lg text-white uppercase tracking-wide">
              Creator Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <UserButton
              user={user}
              onSignOut={async () => {
                "use server"
                await signOut(logtoConfig)
              }}
            />
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>

      {/* Guided Tour - wrapped in Suspense for useSearchParams */}
      <Suspense fallback={null}>
        <GuidedTour userId={dbUser.id} showTour={showTour} />
      </Suspense>
    </div>
  )
}
