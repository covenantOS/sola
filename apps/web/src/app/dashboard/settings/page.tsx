export const dynamic = "force-dynamic"

import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import Link from "next/link"
import {
  CreditCard,
  User,
  Bell,
  Shield,
  Globe,
  Palette,
  ChevronRight,
} from "lucide-react"

const settingsLinks = [
  {
    name: "Payments",
    description: "Manage Stripe Connect and payment settings",
    href: "/dashboard/settings/payments",
    icon: CreditCard,
  },
  {
    name: "Profile",
    description: "Update your personal information",
    href: "/dashboard/settings/profile",
    icon: User,
  },
  {
    name: "Notifications",
    description: "Configure email and push notifications",
    href: "/dashboard/settings/notifications",
    icon: Bell,
  },
  {
    name: "Security",
    description: "Manage password and two-factor authentication",
    href: "/dashboard/settings/security",
    icon: Shield,
  },
  {
    name: "Domain",
    description: "Set up a custom domain for your site",
    href: "/dashboard/settings/domain",
    icon: Globe,
  },
  {
    name: "Branding",
    description: "Customize your community's appearance",
    href: "/dashboard/settings/branding",
    icon: Palette,
  },
]

export default async function SettingsPage() {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl text-white uppercase tracking-wide">
          Settings
        </h1>
        <p className="text-white/60 mt-1">
          Manage your organization and account settings.
        </p>
      </div>

      {/* Organization Info */}
      {organization && (
        <div className="bg-white/5 border border-white/10 p-6">
          <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4">
            Organization
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wide mb-1">
                Name
              </p>
              <p className="text-white">{organization.name}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wide mb-1">
                Subdomain
              </p>
              <p className="text-white">
                {organization.slug}.{process.env.NEXT_PUBLIC_SUBDOMAIN_BASE || "my.solaplus.ai"}
              </p>
            </div>
            {organization.description && (
              <div className="md:col-span-2">
                <p className="text-xs text-white/40 uppercase tracking-wide mb-1">
                  Description
                </p>
                <p className="text-white/80">{organization.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Links */}
      <div className="grid gap-4 md:grid-cols-2">
        {settingsLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="bg-white/5 border border-white/10 p-6 hover:border-sola-gold/50 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center flex-shrink-0">
                  <link.icon className="h-5 w-5 text-sola-gold" />
                </div>
                <div>
                  <h3 className="font-display text-white uppercase tracking-wide group-hover:text-sola-gold transition-colors">
                    {link.name}
                  </h3>
                  <p className="text-sm text-white/60 mt-1">{link.description}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-sola-gold transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
