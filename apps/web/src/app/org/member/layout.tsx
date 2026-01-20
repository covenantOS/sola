import { redirect } from "next/navigation"
import Link from "next/link"
import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import {
  Home,
  Users,
  BookOpen,
  Video,
  MessageSquare,
  User,
  LogOut,
} from "lucide-react"

export const dynamic = "force-dynamic"

const navigation = [
  { name: "Home", href: "/member", icon: Home },
  { name: "Community", href: "/member/community", icon: Users },
  { name: "Courses", href: "/member/courses", icon: BookOpen },
  { name: "Livestreams", href: "/member/livestreams", icon: Video },
  { name: "Messages", href: "/member/messages", icon: MessageSquare },
]

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get current member
  const member = await getCurrentMember()

  // Get organization
  const org = await getOrganizationByDomain()

  if (!org) {
    redirect("/")
  }

  if (!member) {
    redirect("/login")
  }

  // Check membership
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: member.id,
        organizationId: org.id,
      },
    },
    include: {
      tier: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!membership) {
    // User is logged in but not a member of this org
    redirect("/signup")
  }

  // Get org settings
  const settings = (org.settings as Record<string, unknown>) || {}
  const primaryColor = (settings.primaryColor as string) || "#D4A84B"

  return (
    <div
      className="min-h-screen bg-sola-black"
      style={{ "--brand-color": primaryColor } as React.CSSProperties}
    >
      {/* Top accent bar */}
      <div
        className="fixed top-0 left-0 right-0 h-1 z-[60]"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Header */}
      <header className="fixed top-1 left-0 right-0 z-50 bg-sola-dark-navy border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/member" className="flex items-center gap-3">
              {org.logo ? (
                <img
                  src={org.logo}
                  alt={org.name}
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <div
                  className="h-8 w-8 flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {org.name.charAt(0)}
                </div>
              )}
              <span className="font-display text-white text-sm uppercase tracking-wide hidden sm:block">
                {org.name}
              </span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <style>{`
                .member-nav-link:hover {
                  color: var(--brand-color) !important;
                }
              `}</style>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="member-nav-link flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="hidden md:inline text-sm">{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* User menu */}
            <div className="flex items-center gap-4">
              {membership.tier && (
                <span
                  className="text-xs px-2 py-1 hidden sm:block"
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                >
                  {membership.tier.name}
                </span>
              )}
              <div className="flex items-center gap-2">
                <Link
                  href="/member/profile"
                  className="flex items-center gap-2 text-white/60 hover:text-white"
                >
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name || ""}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-sm text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {member.name?.charAt(0) || member.email.charAt(0)}
                    </div>
                  )}
                </Link>
                <form action="/api/member/logout" method="POST">
                  <button
                    type="submit"
                    className="text-white/40 hover:text-white/60 p-2"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-[calc(1rem+4rem+1px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
