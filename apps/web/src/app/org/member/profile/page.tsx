import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { User, CreditCard, Bell, Shield, ArrowRight } from "lucide-react"
import { ProfileForm } from "./profile-form"
import { SubscriptionCard } from "./subscription-card"

export const dynamic = "force-dynamic"

export default async function MemberProfilePage() {
  const member = await getCurrentMember()
  const org = await getOrganizationByDomain()

  if (!member || !org) {
    redirect("/login")
  }

  // Get membership with tier
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

  // Get available tiers for upgrade
  const availableTiers = await db.membershipTier.findMany({
    where: {
      organizationId: org.id,
      isActive: true,
    },
    orderBy: { position: "asc" },
  })

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl text-white uppercase tracking-tight">
          Account Settings
        </h1>
        <p className="text-white/60 mt-1">
          Manage your profile and subscription
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <User className="h-5 w-5" style={{ color: primaryColor }} />
          <h2 className="font-display text-white uppercase tracking-wide">
            Profile
          </h2>
        </div>
        <div className="p-6">
          <ProfileForm
            member={{
              id: member.id,
              name: member.name || "",
              email: member.email,
              avatar: member.avatar,
            }}
            primaryColor={primaryColor}
          />
        </div>
      </div>

      {/* Subscription Section */}
      <div className="bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <CreditCard className="h-5 w-5" style={{ color: primaryColor }} />
          <h2 className="font-display text-white uppercase tracking-wide">
            Subscription
          </h2>
        </div>
        <div className="p-6">
          <SubscriptionCard
            membership={{
              id: membership.id,
              status: membership.status,
              tierId: membership.tierId,
              tierName: membership.tier?.name || "Free",
              tierPrice: Number(membership.tier?.price || 0),
              tierInterval: membership.tier?.interval || "month",
              currentPeriodEnd: membership.currentPeriodEnd,
              stripeCustomerId: membership.stripeCustomerId,
            }}
            availableTiers={availableTiers.map((t) => ({
              id: t.id,
              name: t.name,
              price: Number(t.price),
              interval: t.interval,
            }))}
            primaryColor={primaryColor}
            orgId={org.id}
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/member"
          className="flex items-center justify-between p-4 bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
        >
          <span className="text-white">Back to Dashboard</span>
          <ArrowRight className="h-4 w-4 text-white/40" />
        </Link>
        <form action="/api/member/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 hover:border-red-500/50 transition-colors text-left"
          >
            <span className="text-white">Sign Out</span>
            <ArrowRight className="h-4 w-4 text-white/40" />
          </button>
        </form>
      </div>
    </div>
  )
}
