import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Shield,
  Crown,
  User,
} from "lucide-react"
import { format } from "date-fns"
import { MemberActions } from "@/components/dashboard/member-actions"

interface PageProps {
  searchParams: Promise<{
    search?: string
    tier?: string
    status?: string
    role?: string
  }>
}

export default async function MembersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  if (!isAuthenticated) {
    redirect("/")
  }

  const { organization } = await getUserWithOrganization(claims?.sub || "")
  if (!organization) {
    redirect("/dashboard")
  }

  // Build filters
  const where: any = { organizationId: organization.id }

  if (params.search) {
    where.user = {
      OR: [
        { name: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ],
    }
  }

  if (params.tier) {
    where.tierId = params.tier
  }

  if (params.status) {
    where.status = params.status
  }

  if (params.role) {
    where.role = params.role
  }

  // Get members
  const members = await db.membership.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      tier: {
        select: { id: true, name: true },
      },
    },
    orderBy: { joinedAt: "desc" },
  })

  // Get tiers for filter
  const tiers = await db.membershipTier.findMany({
    where: { organizationId: organization.id },
    select: { id: true, name: true },
  })

  const roleIcons = {
    OWNER: Crown,
    ADMIN: Shield,
    MODERATOR: Shield,
    MEMBER: User,
  }

  const roleColors = {
    OWNER: "text-sola-gold",
    ADMIN: "text-sola-red",
    MODERATOR: "text-blue-400",
    MEMBER: "text-white/60",
  }

  const statusColors = {
    ACTIVE: "text-green-500",
    PAUSED: "text-yellow-500",
    CANCELLED: "text-white/40",
    PAST_DUE: "text-sola-red",
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white uppercase tracking-tight">
            Members
          </h1>
          <p className="text-white/60 mt-2">
            {members.length} total member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 p-4">
        <form className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                name="search"
                defaultValue={params.search || ""}
                placeholder="Search by name or email..."
                className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-2 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none"
              />
            </div>
          </div>

          <select
            name="tier"
            defaultValue={params.tier || ""}
            className="bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-sola-gold focus:outline-none"
          >
            <option value="">All Tiers</option>
            {tiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.name}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={params.status || ""}
            className="bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-sola-gold focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="PAST_DUE">Past Due</option>
          </select>

          <select
            name="role"
            defaultValue={params.role || ""}
            className="bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-sola-gold focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
            <option value="MODERATOR">Moderator</option>
            <option value="MEMBER">Member</option>
          </select>

          <button
            type="submit"
            className="bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-2 text-sm"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Members Table */}
      {members.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-12 text-center">
          <Users className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <h2 className="font-display text-xl text-white uppercase tracking-wide mb-2">
            No Members Found
          </h2>
          <p className="text-white/60">
            {params.search || params.tier || params.status || params.role
              ? "Try adjusting your filters"
              : "Share your community to start getting members"}
          </p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs text-white/50 uppercase tracking-wide">
                  Member
                </th>
                <th className="px-6 py-4 text-left text-xs text-white/50 uppercase tracking-wide">
                  Tier
                </th>
                <th className="px-6 py-4 text-left text-xs text-white/50 uppercase tracking-wide">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs text-white/50 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs text-white/50 uppercase tracking-wide">
                  Joined
                </th>
                <th className="px-6 py-4 text-right text-xs text-white/50 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {members.map((member) => {
                const RoleIcon = roleIcons[member.role]
                const roleColor = roleColors[member.role]
                const statusColor = statusColors[member.status]

                return (
                  <tr key={member.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {member.user.avatar ? (
                          <img
                            src={member.user.avatar}
                            alt={member.user.name || "User"}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-sola-gold/20 rounded-full flex items-center justify-center">
                            <span className="text-sola-gold font-display text-sm">
                              {(member.user.name || member.user.email)[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">
                            {member.user.name || "Unnamed"}
                          </p>
                          <p className="text-white/50 text-sm">{member.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/80">
                        {member.tier?.name || "Free"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 ${roleColor}`}>
                        <RoleIcon className="h-4 w-4" />
                        <span className="text-sm capitalize">
                          {member.role.toLowerCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${statusColor}`}>
                        {member.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/50 text-sm">
                        {format(new Date(member.joinedAt), "MMM d, yyyy")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <MemberActions
                        memberId={member.id}
                        currentRole={member.role}
                        userEmail={member.user.email}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
