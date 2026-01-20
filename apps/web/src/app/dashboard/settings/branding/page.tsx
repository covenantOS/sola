import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { BrandingForm } from "./branding-form"

export default async function BrandingSettingsPage() {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return null
  }

  // Get branding settings from organization
  const orgSettings = (organization.settings as Record<string, unknown>) || {}

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
            Branding Settings
          </h1>
          <p className="text-white/60 mt-1">
            Customize the look and feel of your community.
          </p>
        </div>
      </div>

      {/* Branding Form */}
      <BrandingForm
        organizationId={organization.id}
        initialData={{
          name: organization.name,
          description: organization.description || "",
          logo: organization.logo || "",
          banner: organization.banner || "",
          primaryColor: (orgSettings.primaryColor as string) || "#D4A84B",
        }}
      />
    </div>
  )
}
