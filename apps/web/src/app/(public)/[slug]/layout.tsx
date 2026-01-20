import { getOrganizationBySlug } from "@/lib/organization"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserByLogtoId } from "@/lib/user-sync"
import { getUserMembership } from "@/lib/organization"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Home,
  Users,
  BookOpen,
  Video,
  MessageSquare,
  Settings,
  LogIn,
} from "lucide-react"
import { PublicUserButton } from "@/components/public/public-user-button"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function PublicLayout({ children, params }: LayoutProps) {
  const { slug } = await params
  const organization = await getOrganizationBySlug(slug)

  if (!organization) {
    notFound()
  }

  // Check if user is authenticated
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)
  let user = null
  let membership = null
  let isOwner = false

  if (isAuthenticated && claims?.sub) {
    user = await getUserByLogtoId(claims.sub)
    if (user) {
      membership = await getUserMembership(user.id, organization.id)
      isOwner = organization.ownerId === user.id
    }
  }

  const navigation = [
    { name: "Home", href: `/${slug}`, icon: Home },
    { name: "Community", href: `/${slug}/community`, icon: Users },
    { name: "Courses", href: `/${slug}/courses`, icon: BookOpen },
    { name: "Live", href: `/${slug}/live`, icon: Video },
  ]

  const memberNavigation = [
    { name: "Messages", href: `/${slug}/messages`, icon: MessageSquare },
    { name: "Settings", href: `/${slug}/settings`, icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-sola-black">
      {/* Red accent line at top */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-sola-red z-[60]" />

      {/* Header */}
      <header className="sticky top-1 z-50 bg-sola-dark-navy/95 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Org Name */}
            <Link href={`/${slug}`} className="flex items-center gap-3">
              {organization.logo ? (
                <Image
                  src={organization.logo}
                  alt={organization.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-sola-gold/20 flex items-center justify-center">
                  <span className="text-sola-gold font-display text-lg">
                    {organization.name[0]}
                  </span>
                </div>
              )}
              <span className="font-display text-white text-lg uppercase tracking-wide hidden sm:block">
                {organization.name}
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="font-display text-sm uppercase tracking-wide">
                    {item.name}
                  </span>
                </Link>
              ))}
            </nav>

            {/* User Actions */}
            <div className="flex items-center gap-4">
              {isAuthenticated && user ? (
                <>
                  {membership && (
                    <nav className="hidden md:flex items-center gap-1">
                      {memberNavigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="font-display text-xs uppercase tracking-wide">
                            {item.name}
                          </span>
                        </Link>
                      ))}
                    </nav>
                  )}
                  <PublicUserButton
                    user={{
                      name: user.name || undefined,
                      email: user.email,
                      avatar: user.avatar || undefined,
                    }}
                    isOwner={isOwner}
                    slug={slug}
                  />
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href={`/${slug}/login`}
                    className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="font-display text-sm uppercase tracking-wide">
                      Login
                    </span>
                  </Link>
                  <Link
                    href={`/${slug}/join`}
                    className="bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-2 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
                  >
                    Join
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
