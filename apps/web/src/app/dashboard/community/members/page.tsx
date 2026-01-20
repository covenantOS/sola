import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import Link from "next/link"
import { ArrowLeft, Users, Search, MoreVertical, Crown, Shield, UserCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MODERATOR: UserCheck,
  MEMBER: Users,
}

const roleColors = {
  OWNER: "text-sola-gold",
  ADMIN: "text-purple-400",
  MODERATOR: "text-blue-400",
  MEMBER: "text-white/60",
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; tier?: string }>
}) {
  const { page = "1", search = "", tier = "" } = await searchParams
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return <div>Organization not found</div>
  }

  const pageSize = 20
  const currentPage = parseInt(page, 10) || 1
  const skip = (currentPage - 1) * pageSize

  // Build where clause
  const where: any = {
    organizationId: organization.id,
    status: "ACTIVE",
  }

  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }
  }

  if (tier) {
    where.tierId = tier
  }

  // Get members with pagination
  const [members, totalCount] = await Promise.all([
    db.membership.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        tier: { select: { id: true, name: true } },
      },
      orderBy: { joinedAt: "desc" },
      take: pageSize,
      skip,
    }),
    db.membership.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  // Get tiers for filter
  const tiers = await db.membershipTier.findMany({
    where: { organizationId: organization.id, isActive: true },
    orderBy: { position: "asc" },
  })

  // Get member stats
  const tierCounts = await db.membership.groupBy({
    by: ["tierId"],
    where: { organizationId: organization.id, status: "ACTIVE" },
    _count: true,
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/community"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Community
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-white uppercase tracking-wide">
              Members
            </h1>
            <p className="text-white/60 mt-1">
              {totalCount} active members in your community.
            </p>
          </div>
        </div>
      </div>

      {/* Tier Stats */}
      <div className="flex gap-4 flex-wrap">
        <Link
          href="/dashboard/community/members"
          className={`px-4 py-2 text-sm transition-colors ${
            !tier ? "bg-sola-gold text-sola-black" : "bg-white/5 text-white/60 hover:bg-white/10"
          }`}
        >
          All ({totalCount})
        </Link>
        {tiers.map((t) => {
          const count = tierCounts.find((c) => c.tierId === t.id)?._count || 0
          return (
            <Link
              key={t.id}
              href={`/dashboard/community/members?tier=${t.id}`}
              className={`px-4 py-2 text-sm transition-colors ${
                tier === t.id ? "bg-sola-gold text-sola-black" : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {t.name} ({count})
            </Link>
          )
        })}
      </div>

      {/* Search */}
      <form className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by name or email..."
            className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-2 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Members List */}
      {members.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-12 text-center">
          <Users className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <h3 className="font-display text-lg text-white uppercase tracking-wide mb-2">
            No Members Found
          </h3>
          <p className="text-white/60">
            {search ? "Try a different search term." : "Your community is waiting for its first member!"}
          </p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/10 text-xs text-white/40 uppercase tracking-wide">
            <div className="col-span-5">Member</div>
            <div className="col-span-2">Tier</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Joined</div>
            <div className="col-span-1"></div>
          </div>
          {members.map((member) => {
            const RoleIcon = roleIcons[member.role as keyof typeof roleIcons] || Users
            const roleColor = roleColors[member.role as keyof typeof roleColors] || "text-white/60"

            return (
              <div
                key={member.id}
                className="grid grid-cols-12 gap-4 px-4 py-4 items-center border-b border-white/5 last:border-0"
              >
                <div className="col-span-5 flex items-center gap-3">
                  {member.user.avatar ? (
                    <img
                      src={member.user.avatar}
                      alt={member.user.name || ""}
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
                    <p className="text-white font-medium">{member.user.name || "Unnamed"}</p>
                    <p className="text-xs text-white/40">{member.user.email}</p>
                  </div>
                </div>
                <div className="col-span-2">
                  {member.tier ? (
                    <span className="text-sm text-white/80">{member.tier.name}</span>
                  ) : (
                    <span className="text-sm text-white/40">No tier</span>
                  )}
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <RoleIcon className={`h-4 w-4 ${roleColor}`} />
                  <span className={`text-sm capitalize ${roleColor}`}>
                    {member.role.toLowerCase()}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-white/60">
                    {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  <button className="p-2 text-white/40 hover:text-white transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/dashboard/community/members?page=${currentPage - 1}${search ? `&search=${search}` : ""}${tier ? `&tier=${tier}` : ""}`}
              className="px-4 py-2 bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-white/60">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/dashboard/community/members?page=${currentPage + 1}${search ? `&search=${search}` : ""}${tier ? `&tier=${tier}` : ""}`}
              className="px-4 py-2 bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
