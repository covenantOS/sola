import { getOrganizationBySlug, getUserMembership } from "@/lib/organization"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserByLogtoId } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import {
  User,
  CreditCard,
  Bell,
  Shield,
  LogOut,
  Camera,
  Check,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
import { MemberSettingsForm } from "@/components/public/member-settings-form"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function MemberSettingsPage({ params }: PageProps) {
  const { slug } = await params
  const organization = await getOrganizationBySlug(slug)

  if (!organization) {
    notFound()
  }

  // Check authentication
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)
  if (!isAuthenticated || !claims?.sub) {
    redirect(`/${slug}/login`)
  }

  const user = await getUserByLogtoId(claims.sub)
  if (!user) {
    redirect(`/${slug}/login`)
  }

  const membership = await getUserMembership(user.id, organization.id)
  if (!membership) {
    redirect(`/${slug}/join`)
  }

  // Get tier info
  const tier = membership.tier

  // Get billing history (simplified - from membership)
  const billingHistory = membership.stripeSubscriptionId
    ? [
        {
          date: membership.joinedAt,
          amount: tier?.price || 0,
          status: membership.status,
        },
      ]
    : []

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl text-white uppercase tracking-tight">
          Account Settings
        </h1>
        <p className="text-white/60 mt-2">
          Manage your profile and subscription
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <nav className="space-y-1">
            <a
              href="#profile"
              className="flex items-center gap-3 px-4 py-3 bg-sola-gold/10 border-l-2 border-sola-gold text-white"
            >
              <User className="h-5 w-5 text-sola-gold" />
              <span className="font-display text-sm uppercase tracking-wide">Profile</span>
            </a>
            <a
              href="#subscription"
              className="flex items-center gap-3 px-4 py-3 text-white/60 hover:bg-white/5 hover:text-white transition-colors"
            >
              <CreditCard className="h-5 w-5" />
              <span className="font-display text-sm uppercase tracking-wide">Subscription</span>
            </a>
            <a
              href="#notifications"
              className="flex items-center gap-3 px-4 py-3 text-white/60 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="font-display text-sm uppercase tracking-wide">Notifications</span>
            </a>
          </nav>
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-8">
          {/* Profile Section */}
          <section id="profile" className="bg-white/5 border border-white/10 p-6">
            <h2 className="font-display text-xl text-white uppercase tracking-wide mb-6">
              Profile Information
            </h2>

            <MemberSettingsForm
              user={{
                id: user.id,
                name: user.name || "",
                email: user.email,
                avatar: user.avatar || "",
              }}
            />
          </section>

          {/* Subscription Section */}
          <section id="subscription" className="bg-white/5 border border-white/10 p-6">
            <h2 className="font-display text-xl text-white uppercase tracking-wide mb-6">
              Subscription
            </h2>

            {tier ? (
              <div className="space-y-6">
                {/* Current Plan */}
                <div className="flex items-center justify-between p-4 bg-sola-gold/10 border border-sola-gold/30">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wide">Current Plan</p>
                    <p className="font-display text-xl text-sola-gold uppercase tracking-wide">
                      {tier.name}
                    </p>
                    <p className="text-white/60 text-sm mt-1">
                      ${Number(tier.price).toFixed(2)}/{tier.interval}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-green-500">
                    <Check className="h-5 w-5" />
                    <span className="text-sm">Active</span>
                  </div>
                </div>

                {/* Billing Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wide">Next Billing Date</p>
                    <p className="text-white mt-1">
                      {membership.currentPeriodEnd
                        ? format(new Date(membership.currentPeriodEnd), "MMMM d, yyyy")
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wide">Payment Method</p>
                    <p className="text-white mt-1 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-white/40" />
                      •••• •••• •••• ****
                    </p>
                  </div>
                </div>

                {/* Cancel Warning */}
                {membership.cancelAtPeriodEnd && (
                  <div className="flex items-start gap-3 p-4 bg-sola-red/10 border border-sola-red/30">
                    <AlertCircle className="h-5 w-5 text-sola-red flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Subscription Canceling</p>
                      <p className="text-white/60 text-sm">
                        Your subscription will end on{" "}
                        {membership.currentPeriodEnd &&
                          format(new Date(membership.currentPeriodEnd), "MMMM d, yyyy")}
                        . You can reactivate anytime before then.
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-4">
                  <Link
                    href={`/${slug}/join`}
                    className="border-2 border-white/30 text-white font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm hover:border-sola-gold transition-colors"
                  >
                    Change Plan
                  </Link>
                  <button className="border-2 border-white/30 text-white font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm hover:border-sola-gold transition-colors">
                    Update Payment
                  </button>
                  {!membership.cancelAtPeriodEnd && (
                    <button className="text-sola-red font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm hover:bg-sola-red/10 transition-colors">
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/60 mb-4">You don&apos;t have an active subscription</p>
                <Link
                  href={`/${slug}/join`}
                  className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm"
                >
                  View Plans
                </Link>
              </div>
            )}
          </section>

          {/* Billing History */}
          {billingHistory.length > 0 && (
            <section className="bg-white/5 border border-white/10 p-6">
              <h2 className="font-display text-xl text-white uppercase tracking-wide mb-6">
                Billing History
              </h2>
              <div className="space-y-3">
                {billingHistory.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                  >
                    <div>
                      <p className="text-white">{tier?.name} Membership</p>
                      <p className="text-white/50 text-sm">
                        {format(new Date(item.date), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white">${Number(item.amount).toFixed(2)}</p>
                      <p className="text-green-500 text-sm">Paid</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
