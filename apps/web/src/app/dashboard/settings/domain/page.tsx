import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DomainForm } from "./domain-form"

export default async function DomainSettingsPage() {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return null
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "solaplus.ai"

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/settings"
          className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white/60" />
        </Link>
        <div>
          <h1 className="font-display text-2xl text-white uppercase tracking-wide">
            Domain Settings
          </h1>
          <p className="text-white/60 mt-1">
            Configure your subdomain and custom domain.
          </p>
        </div>
      </div>

      {/* Domain Form */}
      <DomainForm
        organizationId={organization.id}
        currentSlug={organization.slug}
        currentCustomDomain={organization.customDomain}
        rootDomain={rootDomain}
      />
    </div>
  )
}
