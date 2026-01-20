import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, Crown, AlertCircle } from "lucide-react"
import { UpgradeButton } from "./upgrade-button"

export const dynamic = "force-dynamic"

export default async function MemberUpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>
}) {
  const { canceled } = await searchParams
  const member = await getCurrentMember()
  const org = await getOrganizationByDomain()

  if (!member || !org) {
    redirect("/login")
  }

  // Get membership
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: member.id,
        organizationId: org.id,
      },
    },
    include: {
      tier: true,
    },
  })

  if (!membership) {
    redirect("/signup")
  }

  // Get org settings
  const settings = (org.settings as Record<string, unknown>) || {}
  const primaryColor = (settings.primaryColor as string) || "#D4A84B"

  // Get all active tiers
  const tiers = await db.membershipTier.findMany({
    where: {
      organizationId: org.id,
      isActive: true,
    },
    orderBy: { position: "asc" },
  })

  // Check if org can accept payments
  const canAcceptPayments = org.stripeAccountId && org.stripeOnboardingComplete

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        href="/member"
        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="text-center">
        <h1 className="font-display text-3xl text-white uppercase tracking-tight">
          Upgrade Your Membership
        </h1>
        <p className="text-white/60 mt-2">
          Unlock premium content and features
        </p>
      </div>

      {canceled && (
        <div className="bg-orange-500/10 border border-orange-500/30 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-orange-200 text-sm">
            Payment was canceled. You can try again when you're ready.
          </p>
        </div>
      )}

      {!canAcceptPayments && (
        <div className="bg-white/5 border border-white/10 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-white/40 mx-auto mb-3" />
          <p className="text-white/60">
            This organization is not yet set up to accept payments.
            Please check back later.
          </p>
        </div>
      )}

      {canAcceptPayments && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const price = Number(tier.price)
            const features =
              typeof tier.features === "string"
                ? JSON.parse(tier.features)
                : tier.features || []
            const isCurrentTier = membership.tierId === tier.id
            const isUpgrade =
              !isCurrentTier &&
              tiers.findIndex((t) => t.id === tier.id) >
                tiers.findIndex((t) => t.id === membership.tierId)

            return (
              <div
                key={tier.id}
                className={`relative bg-white/5 border p-6 ${
                  isCurrentTier
                    ? "border-2"
                    : "border-white/10 hover:border-white/20"
                }`}
                style={
                  isCurrentTier
                    ? { borderColor: primaryColor }
                    : {}
                }
              >
                {isCurrentTier && (
                  <div
                    className="absolute -top-3 left-4 px-2 py-0.5 text-xs font-display uppercase tracking-wide"
                    style={{ backgroundColor: primaryColor, color: "#000" }}
                  >
                    Current Plan
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="font-display text-xl text-white uppercase tracking-wide flex items-center gap-2">
                    {tier.name}
                    {price > 0 && <Crown className="h-4 w-4" style={{ color: primaryColor }} />}
                  </h3>
                  {tier.description && (
                    <p className="text-white/60 text-sm mt-1">{tier.description}</p>
                  )}
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-display text-white">
                    ${price.toFixed(0)}
                  </span>
                  <span className="text-white/40 text-sm">
                    {price > 0 ? `/${tier.interval}` : ""}
                  </span>
                </div>

                {features.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {features.map((feature: string, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-white/70 text-sm"
                      >
                        <Check
                          className="h-4 w-4 flex-shrink-0 mt-0.5"
                          style={{ color: primaryColor }}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                {isCurrentTier ? (
                  <div className="text-center py-3 text-white/40 text-sm">
                    Your current plan
                  </div>
                ) : price === 0 ? (
                  <button
                    className="w-full py-3 text-sm font-display uppercase tracking-wide border border-white/20 text-white/60 cursor-not-allowed"
                    disabled
                  >
                    Downgrade
                  </button>
                ) : (
                  <UpgradeButton
                    tierId={tier.id}
                    tierName={tier.name}
                    primaryColor={primaryColor}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
