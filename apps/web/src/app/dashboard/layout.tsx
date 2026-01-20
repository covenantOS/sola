import { getLogtoContext, signOut } from "@logto/next/server-actions"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { logtoConfig } from "@/lib/logto"

// Force dynamic rendering for authenticated pages
export const dynamic = "force-dynamic"
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
  Crown,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Community", href: "/dashboard/community", icon: Users },
  { name: "Members", href: "/dashboard/members", icon: Crown },
  { name: "Courses", href: "/dashboard/courses", icon: BookOpen },
  { name: "Livestreams", href: "/dashboard/livestreams", icon: Video },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  if (!isAuthenticated) {
    redirect("/")
  }

  // Sync user to database on every dashboard load
  const dbUser = await syncUserFromLogto({
    sub: claims?.sub || "",
    email: claims?.email as string | undefined,
    name: claims?.name as string | undefined,
    picture: claims?.picture as string | undefined,
  })

  // Check if user has an organization
  const { organization } = await getUserWithOrganization(claims?.sub || "")

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
  const primaryColor = (orgSettings.primaryColor as string) || "#D4A84B"

  const user = {
    sub: claims?.sub || "",
    name: claims?.name as string | undefined,
    email: claims?.email as string | undefined,
    picture: claims?.picture as string | undefined,
  }

  return (
    <div
      className="min-h-screen bg-sola-black"
      style={{ "--brand-color": primaryColor } as React.CSSProperties}
    >
      {/* Accent line at top using brand color */}
      <div
        className="fixed top-0 left-0 right-0 h-1 z-[60]"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-sola-dark-navy border-r border-white/10 pt-1">
        <div className="flex h-16 items-center px-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            {organization.logo ? (
              <img
                src={organization.logo}
                alt={organization.name}
                className="h-8 w-8 object-contain"
              />
            ) : (
              <Image
                src="/logo-dark.svg"
                alt="Sola+"
                width={32}
                height={32}
                className="h-8 w-8"
              />
            )}
            <span className="font-display text-white text-sm uppercase tracking-wide truncate">
              {organization.name}
            </span>
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-4" data-tour="sidebar-nav">
          <style>{`
            .nav-link:hover {
              border-left-color: var(--brand-color) !important;
            }
          `}</style>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="nav-link flex items-center gap-3 px-3 py-2.5 text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent transition-all duration-200"
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

      {/* Guided Tour */}
      <GuidedTour userId={dbUser.id} showTour={showTour} />
    </div>
  )
}
