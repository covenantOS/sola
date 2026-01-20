"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import {
  Users,
  Crown,
  Plus,
  Search,
  MoreVertical,
  User,
  Trash2,
  Shield,
  Ban,
  X,
  Loader2,
  Star,
  Check,
  DollarSign,
  Edit,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  createMembershipTier,
  updateMembershipTier,
  deleteMembershipTier,
  updateMember,
  removeMember,
} from "@/app/actions/members"

interface Tier {
  id: string
  name: string
  description: string | null
  price: number
  interval: string
  features: string
  isActive: boolean
  memberCount: number
}

interface Member {
  id: string
  role: string
  status: string
  joinedAt: Date
  user: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
  tier: {
    id: string
    name: string
  } | null
}

interface MembersClientProps {
  initialTiers: Tier[]
  initialMembers: Member[]
}

export function MembersClient({ initialTiers, initialMembers }: MembersClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"members" | "tiers">("members")
  const [tiers, setTiers] = useState(initialTiers)
  const [members, setMembers] = useState(initialMembers)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateTier, setShowCreateTier] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingMember, setEditingMember] = useState<string | null>(null)

  const [newTier, setNewTier] = useState({
    name: "",
    description: "",
    price: 0,
    interval: "month",
    features: "",
  })

  const [editingTier, setEditingTier] = useState<Tier | null>(null)
  const [editTierData, setEditTierData] = useState({
    name: "",
    description: "",
    price: 0,
    interval: "month",
    features: "",
    isActive: true,
  })

  const filteredMembers = members.filter(
    (m) =>
      m.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateTier = async () => {
    if (!newTier.name.trim()) return
    setIsLoading(true)

    const features = newTier.features
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean)

    const result = await createMembershipTier({
      ...newTier,
      features,
    })

    if (!result.error && result.tier) {
      setTiers((prev) => [...prev, { ...result.tier!, memberCount: 0 }])
      setNewTier({ name: "", description: "", price: 0, interval: "month", features: "" })
      setShowCreateTier(false)
      router.refresh()
    }
    setIsLoading(false)
  }

  const handleDeleteTier = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tier?")) return

    const result = await deleteMembershipTier(id)
    if (result.error) {
      alert(result.error)
      return
    }

    setTiers((prev) => prev.filter((t) => t.id !== id))
    router.refresh()
  }

  const handleStartEditTier = (tier: Tier) => {
    const features = JSON.parse(tier.features || "[]") as string[]
    setEditTierData({
      name: tier.name,
      description: tier.description || "",
      price: tier.price,
      interval: tier.interval,
      features: features.join("\n"),
      isActive: tier.isActive,
    })
    setEditingTier(tier)
  }

  const handleUpdateTier = async () => {
    if (!editingTier || !editTierData.name.trim()) return
    setIsLoading(true)

    const features = editTierData.features
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean)

    const result = await updateMembershipTier({
      id: editingTier.id,
      name: editTierData.name,
      description: editTierData.description,
      price: editTierData.price,
      interval: editTierData.interval,
      features,
      isActive: editTierData.isActive,
    })

    if (!result.error) {
      setTiers((prev) =>
        prev.map((t) =>
          t.id === editingTier.id
            ? {
                ...t,
                name: editTierData.name,
                description: editTierData.description,
                price: editTierData.price,
                interval: editTierData.interval,
                features: JSON.stringify(features),
                isActive: editTierData.isActive,
              }
            : t
        )
      )
      setEditingTier(null)
      router.refresh()
    }
    setIsLoading(false)
  }

  const handleUpdateMemberRole = async (membershipId: string, role: string) => {
    const result = await updateMember({ membershipId, role })
    if (!result.error) {
      setMembers((prev) =>
        prev.map((m) => (m.id === membershipId ? { ...m, role } : m))
      )
      setEditingMember(null)
      router.refresh()
    }
  }

  const handleRemoveMember = async (membershipId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return

    const result = await removeMember(membershipId)
    if (!result.error) {
      setMembers((prev) => prev.filter((m) => m.id !== membershipId))
      router.refresh()
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sola-gold/20 text-sola-gold text-xs uppercase">
            <Crown className="h-3 w-3" />
            Owner
          </span>
        )
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs uppercase">
            <Shield className="h-3 w-3" />
            Admin
          </span>
        )
      case "MODERATOR":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs uppercase">
            <Star className="h-3 w-3" />
            Mod
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 text-white/60 text-xs uppercase">
            Member
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white uppercase tracking-wide">
            Members & Tiers
          </h1>
          <p className="text-white/60 mt-1">
            Manage your community members and membership tiers.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-sola-gold" />
            <span className="text-white/60 text-sm uppercase tracking-wide">
              Total Members
            </span>
          </div>
          <p className="font-display text-3xl text-white">{members.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="h-5 w-5 text-sola-gold" />
            <span className="text-white/60 text-sm uppercase tracking-wide">
              Paid Members
            </span>
          </div>
          <p className="font-display text-3xl text-white">
            {members.filter((m) => m.tier).length}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-sola-gold" />
            <span className="text-white/60 text-sm uppercase tracking-wide">
              Active Tiers
            </span>
          </div>
          <p className="font-display text-3xl text-white">
            {tiers.filter((t) => t.isActive).length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab("members")}
          className={cn(
            "pb-3 px-1 font-display uppercase tracking-wide text-sm transition-colors",
            activeTab === "members"
              ? "text-sola-gold border-b-2 border-sola-gold"
              : "text-white/60 hover:text-white"
          )}
        >
          Members
        </button>
        <button
          onClick={() => setActiveTab("tiers")}
          className={cn(
            "pb-3 px-1 font-display uppercase tracking-wide text-sm transition-colors",
            activeTab === "tiers"
              ? "text-sola-gold border-b-2 border-sola-gold"
              : "text-white/60 hover:text-white"
          )}
        >
          Membership Tiers
        </button>
      </div>

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
            />
          </div>

          {/* Members List */}
          <div className="bg-white/5 border border-white/10 divide-y divide-white/5">
            {filteredMembers.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">
                  {searchQuery ? "No members found" : "No members yet"}
                </p>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 flex items-center justify-center overflow-hidden">
                      {member.user.avatar ? (
                        <img
                          src={member.user.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-white/40" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white">
                          {member.user.name || member.user.email}
                        </p>
                        {getRoleBadge(member.role)}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-white/40">{member.user.email}</p>
                        {member.tier && (
                          <span className="text-xs text-sola-gold">
                            {member.tier.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30">
                      Joined{" "}
                      {formatDistanceToNow(new Date(member.joinedAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setEditingMember(
                            editingMember === member.id ? null : member.id
                          )
                        }
                        className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4 text-white/60" />
                      </button>
                      {editingMember === member.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-sola-dark-navy border border-white/10 shadow-xl z-10">
                          <button
                            onClick={() =>
                              handleUpdateMemberRole(member.id, "ADMIN")
                            }
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5"
                          >
                            <Shield className="h-4 w-4" />
                            Make Admin
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateMemberRole(member.id, "MODERATOR")
                            }
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5"
                          >
                            <Star className="h-4 w-4" />
                            Make Moderator
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateMemberRole(member.id, "MEMBER")
                            }
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5"
                          >
                            <User className="h-4 w-4" />
                            Reset to Member
                          </button>
                          <div className="border-t border-white/10" />
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-sola-red hover:bg-sola-red/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove Member
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tiers Tab */}
      {activeTab === "tiers" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateTier(true)}
              className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
            >
              <Plus className="h-4 w-4" />
              Create Tier
            </button>
          </div>

          {tiers.length === 0 ? (
            <div className="bg-white/5 border border-white/10 p-12 text-center">
              <Crown className="h-16 w-16 text-white/20 mx-auto mb-4" />
              <h3 className="font-display text-xl text-white uppercase tracking-wide mb-2">
                No Membership Tiers
              </h3>
              <p className="text-white/60 mb-6">
                Create tiers to offer exclusive content and features.
              </p>
              <button
                onClick={() => setShowCreateTier(true)}
                className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm"
              >
                <Plus className="h-4 w-4" />
                Create First Tier
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tiers.map((tier) => {
                const features = JSON.parse(tier.features || "[]") as string[]
                return (
                  <div
                    key={tier.id}
                    className={cn(
                      "bg-white/5 border p-6",
                      tier.isActive
                        ? "border-sola-gold/30"
                        : "border-white/10 opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-display text-lg text-white uppercase tracking-wide">
                          {tier.name}
                        </h3>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="font-display text-2xl text-sola-gold">
                            ${tier.price}
                          </span>
                          <span className="text-white/40 text-sm">
                            /{tier.interval}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEditTier(tier)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
                          title="Edit tier"
                        >
                          <Edit className="h-4 w-4 text-white/40 hover:text-white" />
                        </button>
                        <button
                          onClick={() => handleDeleteTier(tier.id)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-sola-red/20 transition-colors"
                          title="Delete tier"
                        >
                          <Trash2 className="h-4 w-4 text-white/40 hover:text-sola-red" />
                        </button>
                      </div>
                    </div>

                    {tier.description && (
                      <p className="text-sm text-white/60 mb-4">
                        {tier.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      {features.map((feature, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm text-white/80"
                        >
                          <Check className="h-4 w-4 text-sola-gold flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                      <span className="text-sm text-white/40">
                        {tier.memberCount} members
                      </span>
                      {!tier.isActive && (
                        <span className="text-xs text-white/40 uppercase">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Tier Modal */}
      {showCreateTier && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-sola-dark-navy border border-white/10 w-full max-w-lg">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-display text-lg text-white uppercase tracking-wide">
                Create Membership Tier
              </h3>
              <button
                onClick={() => setShowCreateTier(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                  Tier Name *
                </label>
                <input
                  type="text"
                  value={newTier.name}
                  onChange={(e) =>
                    setNewTier({ ...newTier, name: e.target.value })
                  }
                  placeholder="Premium"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                  Description
                </label>
                <textarea
                  value={newTier.description}
                  onChange={(e) =>
                    setNewTier({ ...newTier, description: e.target.value })
                  }
                  rows={2}
                  placeholder="What's included in this tier?"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                    Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newTier.price}
                      onChange={(e) =>
                        setNewTier({
                          ...newTier,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/20 text-white focus:border-sola-gold focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                    Billing Interval
                  </label>
                  <select
                    value={newTier.interval}
                    onChange={(e) =>
                      setNewTier({ ...newTier, interval: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white focus:border-sola-gold focus:outline-none transition-colors"
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                    <option value="one_time">One-time</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                  Features (one per line)
                </label>
                <textarea
                  value={newTier.features}
                  onChange={(e) =>
                    setNewTier({ ...newTier, features: e.target.value })
                  }
                  rows={4}
                  placeholder="Access to all content&#10;Private community&#10;Monthly Q&A calls"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors resize-none font-mono text-sm"
                />
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateTier(false)}
                className="px-6 py-3 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTier}
                disabled={!newTier.name.trim() || isLoading}
                className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Tier
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tier Modal */}
      {editingTier && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-sola-dark-navy border border-white/10 w-full max-w-lg">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-display text-lg text-white uppercase tracking-wide">
                Edit Membership Tier
              </h3>
              <button
                onClick={() => setEditingTier(null)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                  Tier Name *
                </label>
                <input
                  type="text"
                  value={editTierData.name}
                  onChange={(e) =>
                    setEditTierData({ ...editTierData, name: e.target.value })
                  }
                  placeholder="Premium"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                  Description
                </label>
                <textarea
                  value={editTierData.description}
                  onChange={(e) =>
                    setEditTierData({ ...editTierData, description: e.target.value })
                  }
                  rows={2}
                  placeholder="What's included in this tier?"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                    Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editTierData.price}
                      onChange={(e) =>
                        setEditTierData({
                          ...editTierData,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/20 text-white focus:border-sola-gold focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                    Billing Interval
                  </label>
                  <select
                    value={editTierData.interval}
                    onChange={(e) =>
                      setEditTierData({ ...editTierData, interval: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white focus:border-sola-gold focus:outline-none transition-colors"
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                    <option value="one_time">One-time</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                  Features (one per line)
                </label>
                <textarea
                  value={editTierData.features}
                  onChange={(e) =>
                    setEditTierData({ ...editTierData, features: e.target.value })
                  }
                  rows={4}
                  placeholder="Access to all content&#10;Private community&#10;Monthly Q&A calls"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors resize-none font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editTierData.isActive}
                    onChange={(e) =>
                      setEditTierData({ ...editTierData, isActive: e.target.checked })
                    }
                    className="w-5 h-5 bg-white/5 border border-white/20 rounded focus:ring-sola-gold"
                  />
                  <span className="text-white/80">Active (visible to members)</span>
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setEditingTier(null)}
                className="px-6 py-3 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTier}
                disabled={!editTierData.name.trim() || isLoading}
                className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
