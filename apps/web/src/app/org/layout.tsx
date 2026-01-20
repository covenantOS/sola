import { notFound } from "next/navigation"
import { getOrganizationByDomain } from "@/lib/subdomain"
import Link from "next/link"

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const org = await getOrganizationByDomain()

  if (!org) {
    notFound()
  }

  // Get branding from org settings
  const settings = (org.settings as Record<string, unknown>) || {}
  const primaryColor = (settings.primaryColor as string) || "#D4A84B"

  return (
    <div className="min-h-screen bg-sola-black">
      {/* Accent line */}
      <div
        className="fixed top-0 left-0 right-0 h-1 z-50"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Header */}
      <header className="sticky top-1 z-40 bg-sola-dark-navy border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Name */}
            <Link href="/" className="flex items-center gap-3">
              {org.logo ? (
                <img
                  src={org.logo}
                  alt={org.name}
                  className="h-10 w-10 object-cover"
                />
              ) : (
                <div
                  className="h-10 w-10 flex items-center justify-center font-display text-lg text-sola-black"
                  style={{ backgroundColor: primaryColor }}
                >
                  {org.name[0]}
                </div>
              )}
              <span className="font-display text-white uppercase tracking-wide">
                {org.name}
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-white/60 hover:text-white transition-colors text-sm"
              >
                Home
              </Link>
              <Link
                href="/community"
                className="text-white/60 hover:text-white transition-colors text-sm"
              >
                Community
              </Link>
              <Link
                href="/courses"
                className="text-white/60 hover:text-white transition-colors text-sm"
              >
                Courses
              </Link>
              <Link
                href="/login"
                className="text-sm font-display uppercase tracking-wide px-4 py-2 text-sola-black"
                style={{ backgroundColor: primaryColor }}
              >
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">
              &copy; {new Date().getFullYear()} {org.name}
            </p>
            <p className="text-white/30 text-xs">
              Powered by{" "}
              <a
                href="https://solaplus.ai"
                className="hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Sola+
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
