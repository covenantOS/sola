import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import Link from "next/link"
import {
  Globe,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Copy,
  Trash2,
  Star,
} from "lucide-react"
import { AddDomainForm } from "./add-domain-form"

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "solaplus.ai"

export default async function DomainsPage() {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return <div>Organization not found</div>
  }

  // Get all domains for this organization
  const domains = await db.domain.findMany({
    where: { organizationId: organization.id },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  })

  // Auto-generated subdomain
  const subdomain = `${organization.slug}.${ROOT_DOMAIN}`

  // Get courses for target selection
  const courses = await db.course.findMany({
    where: { organizationId: organization.id, isPublished: true },
    select: { id: true, title: true, slug: true },
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl text-white uppercase tracking-wide">
            Domains
          </h1>
          <p className="text-white/60 mt-1">
            Manage your community URLs and custom domains.
          </p>
        </div>
      </div>

      {/* Primary Subdomain */}
      <div className="bg-sola-gold/5 border border-sola-gold/30 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-sola-gold/20 flex items-center justify-center">
              <Star className="h-5 w-5 text-sola-gold" />
            </div>
            <div>
              <h3 className="font-display text-white uppercase tracking-wide">
                Your Community URL
              </h3>
              <a
                href={`https://${subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sola-gold hover:underline flex items-center gap-2 mt-1"
              >
                {subdomain}
                <ExternalLink className="h-4 w-4" />
              </a>
              <p className="text-white/40 text-sm mt-2">
                This is your default community URL. It's always active.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Active
          </div>
        </div>
      </div>

      {/* Custom Domains */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-white uppercase tracking-wide">
            Custom Domains
          </h2>
        </div>

        <AddDomainForm courses={courses} />

        {domains.length === 0 ? (
          <div className="bg-white/5 border border-white/10 p-8 text-center mt-4">
            <Globe className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 mb-2">No custom domains yet</p>
            <p className="text-white/40 text-sm">
              Add a custom domain to use your own URL for your community.
            </p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 mt-4">
            {domains.map((domain) => (
              <div
                key={domain.id}
                className="flex items-center justify-between p-4 border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <Globe className="h-5 w-5 text-white/40" />
                  <div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://${domain.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-sola-gold transition-colors"
                      >
                        {domain.domain}
                      </a>
                      {domain.isPrimary && (
                        <span className="text-xs px-2 py-0.5 bg-sola-gold/20 text-sola-gold">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-1">
                      Points to: {domain.targetType.toLowerCase()}
                      {domain.targetId && ` (${domain.targetId})`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {domain.status === "VERIFIED" ? (
                    <span className="flex items-center gap-1 text-green-400 text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      Verified
                    </span>
                  ) : domain.status === "ERROR" ? (
                    <span className="flex items-center gap-1 text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Error
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-orange-400 text-sm">
                      <Clock className="h-4 w-4" />
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DNS Instructions */}
      <div className="bg-white/5 border border-white/10 p-6">
        <h3 className="font-display text-white uppercase tracking-wide mb-4">
          How to Add a Custom Domain
        </h3>
        <ol className="space-y-4 text-white/60">
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-sola-gold/20 text-sola-gold flex items-center justify-center text-sm flex-shrink-0">
              1
            </span>
            <div>
              <p className="text-white">Enter your domain above</p>
              <p className="text-sm">e.g., community.yourdomain.com or courses.yourdomain.com</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-sola-gold/20 text-sola-gold flex items-center justify-center text-sm flex-shrink-0">
              2
            </span>
            <div>
              <p className="text-white">Add a CNAME record in your DNS</p>
              <p className="text-sm">Point your domain to: <code className="bg-white/10 px-2 py-0.5">cname.vercel-dns.com</code></p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-sola-gold/20 text-sola-gold flex items-center justify-center text-sm flex-shrink-0">
              3
            </span>
            <div>
              <p className="text-white">Wait for verification</p>
              <p className="text-sm">DNS changes can take up to 48 hours to propagate.</p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  )
}
