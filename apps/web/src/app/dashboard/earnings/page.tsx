export const dynamic = "force-dynamic"

import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  ArrowUpRight,
  Calendar,
  ExternalLink,
} from "lucide-react"
import { format } from "date-fns"

export default async function EarningsPage() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)
  if (!isAuthenticated) {
    redirect("/")
  }

  const { organization } = await getUserWithOrganization(claims?.sub || "")
  if (!organization) {
    redirect("/dashboard")
  }

  // Get membership stats
  const [totalMembers, activeMembers, tiers] = await Promise.all([
    db.membership.count({
      where: { organizationId: organization.id },
    }),
    db.membership.count({
      where: { organizationId: organization.id, status: "ACTIVE" },
    }),
    db.membershipTier.findMany({
      where: { organizationId: organization.id, isActive: true },
      include: {
        _count: { select: { memberships: true } },
      },
    }),
  ])

  // Calculate estimated MRR
  const mrr = tiers.reduce((acc, tier) => {
    const tierPrice = Number(tier.price)
    const multiplier = tier.interval === "year" ? 1 / 12 : 1
    return acc + tierPrice * tier._count.memberships * multiplier
  }, 0)

  // Placeholder transaction data (would come from Stripe in production)
  const recentTransactions = [
    { member: "John Doe", amount: 29.99, date: new Date(), status: "succeeded" },
    { member: "Jane Smith", amount: 9.99, date: new Date(Date.now() - 86400000), status: "succeeded" },
  ]

  const isStripeConnected = organization.stripeOnboardingComplete

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white uppercase tracking-tight">
            Earnings
          </h1>
          <p className="text-white/60 mt-2">
            Track your revenue and payouts
          </p>
        </div>
        {isStripeConnected && (
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border-2 border-white/30 text-white font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm hover:border-sola-gold transition-colors"
          >
            Stripe Dashboard
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* Stripe Connection Alert */}
      {!isStripeConnected && (
        <div className="bg-sola-gold/10 border border-sola-gold/30 p-6">
          <div className="flex items-start gap-4">
            <CreditCard className="h-6 w-6 text-sola-gold flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-display text-white uppercase tracking-wide">
                Connect Stripe to Accept Payments
              </h3>
              <p className="text-white/60 text-sm mt-1">
                You need to connect your Stripe account before you can accept membership payments.
              </p>
              <Link
                href="/dashboard/settings/payments"
                className="inline-flex items-center gap-2 mt-4 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm"
              >
                Connect Stripe
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Monthly Revenue</span>
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-sola-gold" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl text-white">
              ${mrr.toFixed(2)}
            </span>
            <span className="text-white/40 text-sm ml-2">MRR</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Active Members</span>
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-sola-gold" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl text-white">{activeMembers}</span>
            <span className="text-white/40 text-sm ml-2">/ {totalMembers}</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Avg. Revenue/Member</span>
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-sola-gold" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl text-white">
              ${activeMembers > 0 ? (mrr / activeMembers).toFixed(2) : "0.00"}
            </span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Stripe Status</span>
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-sola-gold" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {isStripeConnected ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-green-400 text-sm">Connected</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-sola-gold rounded-full" />
                <span className="text-sola-gold text-sm">Not Connected</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Revenue by Tier */}
      <div className="bg-white/5 border border-white/10 p-6">
        <h2 className="font-display text-xl text-white uppercase tracking-wide mb-6">
          Revenue by Tier
        </h2>
        {tiers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/40">No tiers created yet</p>
            <Link
              href="/dashboard/tiers"
              className="text-sola-gold text-sm hover:underline mt-2 inline-block"
            >
              Create your first tier
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tiers.map((tier) => {
              const tierPrice = Number(tier.price)
              const tierMrr =
                tierPrice * tier._count.memberships * (tier.interval === "year" ? 1 / 12 : 1)
              const percentage = mrr > 0 ? (tierMrr / mrr) * 100 : 0

              return (
                <div key={tier.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-white font-display uppercase tracking-wide">
                        {tier.name}
                      </span>
                      <span className="text-white/40 text-sm ml-2">
                        ({tier._count.memberships} members)
                      </span>
                    </div>
                    <span className="text-sola-gold font-display">
                      ${tierMrr.toFixed(2)}/mo
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sola-gold"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white/5 border border-white/10 p-6">
        <h2 className="font-display text-xl text-white uppercase tracking-wide mb-6">
          Recent Transactions
        </h2>
        {!isStripeConnected ? (
          <div className="text-center py-8">
            <p className="text-white/40">Connect Stripe to see transactions</p>
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/40">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((tx, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sola-gold/10 rounded-full flex items-center justify-center">
                    <span className="text-sola-gold font-display text-sm">
                      {tx.member[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white">{tx.member}</p>
                    <p className="text-white/50 text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(tx.date, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sola-gold font-display">${tx.amount.toFixed(2)}</p>
                  <p className="text-green-500 text-xs capitalize">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
