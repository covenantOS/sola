"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  DollarSign,
  Users,
  Check,
  X,
} from "lucide-react"
import { getTiers, createTier, updateTier, deleteTier } from "@/app/actions/tiers"

type Tier = {
  id: string
  name: string
  description: string | null
  price: number
  interval: string
  features: string[]
  position: number
  isActive: boolean
  _count: {
    memberships: number
  }
}

export default function TiersPage() {
  const [tiers, setTiers] = useState<Tier[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTier, setEditingTier] = useState<Tier | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    interval: "month",
    features: [""],
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadTiers()
  }, [])

  const loadTiers = async () => {
    const result = await getTiers()
    if (result.tiers) {
      setTiers(result.tiers as Tier[])
    }
    setLoading(false)
  }

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim() || !formData.price) return
    setSubmitting(true)

    const data = new FormData()
    data.set("name", formData.name)
    data.set("description", formData.description)
    data.set("price", formData.price)
    data.set("interval", formData.interval)
    data.set("features", JSON.stringify(formData.features.filter((f) => f.trim())))

    let result
    if (editingTier) {
      result = await updateTier(editingTier.id, data)
    } else {
      result = await createTier(data)
    }

    if (result.success) {
      await loadTiers()
      resetForm()
    }
    setSubmitting(false)
  }, [formData, editingTier])

  const handleDelete = useCallback(async (tierId: string) => {
    if (!confirm("Are you sure you want to delete this tier?")) return

    const result = await deleteTier(tierId)
    if (result.success) {
      setTiers((prev) => prev.filter((t) => t.id !== tierId))
    }
  }, [])

  const resetForm = () => {
    setShowForm(false)
    setEditingTier(null)
    setFormData({
      name: "",
      description: "",
      price: "",
      interval: "month",
      features: [""],
    })
  }

  const startEdit = (tier: Tier) => {
    setEditingTier(tier)
    setFormData({
      name: tier.name,
      description: tier.description || "",
      price: String(tier.price),
      interval: tier.interval,
      features: tier.features.length > 0 ? tier.features : [""],
    })
    setShowForm(true)
  }

  const addFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, ""],
    }))
  }

  const updateFeature = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.map((f, i) => (i === index ? value : f)),
    }))
  }

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sola-gold"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white uppercase tracking-tight">
            Membership Tiers
          </h1>
          <p className="text-white/60 mt-2">
            Create and manage your membership tiers
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
        >
          <Plus className="h-4 w-4" />
          New Tier
        </button>
      </div>

      {/* Tier Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-sola-dark-navy border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-display text-xl text-white uppercase tracking-wide">
                {editingTier ? "Edit Tier" : "New Tier"}
              </h2>
              <button onClick={resetForm} className="text-white/60 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-sola-gold focus:outline-none"
                  placeholder="e.g., Premium"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-sola-gold focus:outline-none resize-none"
                  rows={3}
                  placeholder="What's included in this tier?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                    Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 pl-8 text-white focus:border-sola-gold focus:outline-none"
                      placeholder="10"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                    Billing Interval
                  </label>
                  <select
                    value={formData.interval}
                    onChange={(e) => setFormData((p) => ({ ...p, interval: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-sola-gold focus:outline-none"
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                    <option value="one_time">One Time</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                  Features
                </label>
                <div className="space-y-2">
                  {formData.features.map((feature, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(i, e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-sola-gold focus:outline-none"
                        placeholder="e.g., Access to all content"
                      />
                      {formData.features.length > 1 && (
                        <button
                          onClick={() => removeFeature(i)}
                          className="p-2 text-white/40 hover:text-sola-red"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addFeature}
                    className="text-sola-gold text-sm hover:underline"
                  >
                    + Add Feature
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-4">
              <button
                onClick={resetForm}
                className="px-6 py-3 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !formData.name.trim() || !formData.price}
                className="bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingTier ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tiers List */}
      {tiers.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-12 text-center">
          <DollarSign className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <h2 className="font-display text-xl text-white uppercase tracking-wide mb-2">
            No Tiers Yet
          </h2>
          <p className="text-white/60 mb-6">
            Create your first membership tier to start accepting members
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm"
          >
            <Plus className="h-4 w-4" />
            Create Tier
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="bg-white/5 border border-white/10 overflow-hidden hover:border-sola-gold/30 transition-all"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-xl text-white uppercase tracking-wide">
                      {tier.name}
                    </h3>
                    <div className="mt-2">
                      <span className="font-display text-3xl text-sola-gold">
                        ${Number(tier.price).toFixed(0)}
                      </span>
                      <span className="text-white/50">/{tier.interval}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(tier)}
                      className="p-2 text-white/40 hover:text-sola-gold transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tier.id)}
                      className="p-2 text-white/40 hover:text-sola-red transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {tier.description && (
                  <p className="text-white/60 text-sm mt-3">{tier.description}</p>
                )}
                {tier.features.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-sola-gold flex-shrink-0 mt-0.5" />
                        <span className="text-white/70">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center gap-2">
                <Users className="h-4 w-4 text-white/40" />
                <span className="text-white/50 text-sm">
                  {tier._count.memberships} member{tier._count.memberships !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
