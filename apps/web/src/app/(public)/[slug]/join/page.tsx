import { getOrganizationBySlug } from "@/lib/organization"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Check, ArrowRight } from "lucide-react"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function JoinPage({ params }: PageProps) {
  const { slug } = await params
  const organization = await getOrganizationBySlug(slug)

  if (!organization) {
    notFound()
  }

  // Get membership tiers
  const tiers = await db.membershipTier.findMany({
    where: { organizationId: organization.id, isActive: true },
    orderBy: { position: "asc" },
  })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl text-white uppercase tracking-tight">
          Join {organization.name}
        </h1>
        <p className="text-white/60 mt-4">
          Choose the membership tier that&apos;s right for you
        </p>
      </div>

      {tiers.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-8 text-center">
          <p className="text-white/60">
            No membership tiers available yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier, index) => {
            const features = Array.isArray(tier.features) ? tier.features : []
            const isPopular = index === 1 // Middle tier is "popular"

            return (
              <div
                key={tier.id}
                className={`relative bg-white/5 border p-6 ${
                  isPopular
                    ? "border-sola-gold shadow-[0_0_30px_rgba(212,168,75,0.2)]"
                    : "border-white/10"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sola-gold text-sola-black font-display text-xs uppercase tracking-widest px-4 py-1">
                    Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="font-display text-xl text-white uppercase tracking-wide">
                    {tier.name}
                  </h3>
                  <div className="mt-4">
                    <span className="font-display text-4xl text-white">
                      ${Number(tier.price).toFixed(0)}
                    </span>
                    <span className="text-white/50">/{tier.interval}</span>
                  </div>
                  {tier.description && (
                    <p className="text-white/60 text-sm mt-2">{tier.description}</p>
                  )}
                </div>

                {features.length > 0 && (
                  <ul className="space-y-3 mb-6">
                    {(features as string[]).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-sola-gold flex-shrink-0" />
                        <span className="text-white/80 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  href={`/${slug}/join/${tier.id}`}
                  className={`w-full flex items-center justify-center gap-2 font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 ${
                    isPopular
                      ? "bg-sola-gold text-sola-black hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
                      : "border-2 border-white/30 text-white hover:border-white"
                  }`}
                >
                  Select Plan
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )
          })}
        </div>
      )}

      <div className="text-center mt-8">
        <p className="text-white/50 text-sm">
          Already a member?{" "}
          <Link href={`/${slug}/login`} className="text-sola-gold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
