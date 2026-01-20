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
import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { syncUserFromLogto, getUserWithOrganization } from "@/lib/user-sync"

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
        <SidebarNav />
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
