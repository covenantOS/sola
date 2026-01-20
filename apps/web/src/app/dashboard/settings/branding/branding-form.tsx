"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, Image as ImageIcon, Check } from "lucide-react"
import { updateBrandingSettings } from "@/app/actions/settings"
import { cn } from "@/lib/utils"

interface BrandingFormProps {
  organizationId: string
  initialData: {
    name: string
    description: string
    logo: string
    banner: string
    primaryColor: string
  }
}

const COLORS = [
  { value: "#D4A84B", label: "Gold" },
  { value: "#ED1C24", label: "Red" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Green" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EC4899", label: "Pink" },
  { value: "#6366F1", label: "Indigo" },
  { value: "#14B8A6", label: "Teal" },
  { value: "#F97316", label: "Orange" },
  { value: "#84CC16", label: "Lime" },
  { value: "#06B6D4", label: "Cyan" },
]

export function BrandingForm({ organizationId, initialData }: BrandingFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [data, setData] = useState(initialData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updateBrandingSettings({
        organizationId,
        ...data,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        router.refresh()
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Organization Name & Description */}
      <div className="bg-white/5 border border-white/10 p-6">
        <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4">
          Organization Info
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
              Organization Name
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="Your organization name"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
              Description
            </label>
            <textarea
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              rows={3}
              placeholder="A brief description of your organization..."
              className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      {/* Logo & Banner */}
      <div className="bg-white/5 border border-white/10 p-6">
        <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4">
          Images
        </h2>
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {data.logo ? (
                <img
                  src={data.logo}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="h-10 w-10 text-white/40" />
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={data.logo}
                onChange={(e) => setData({ ...data, logo: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
              />
              <p className="text-xs text-white/40 mt-2">
                Recommended: Square image, at least 200x200px
              </p>
            </div>
          </div>

          {/* Banner */}
          <div>
            <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
              Banner URL
            </label>
            <div className="mb-3 w-full h-32 bg-white/10 overflow-hidden">
              {data.banner ? (
                <img
                  src={data.banner}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-white/40" />
                </div>
              )}
            </div>
            <input
              type="url"
              value={data.banner}
              onChange={(e) => setData({ ...data, banner: e.target.value })}
              placeholder="https://example.com/banner.jpg"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
            />
            <p className="text-xs text-white/40 mt-2">
              Recommended: 1200x300px for best results
            </p>
          </div>
        </div>
      </div>

      {/* Primary Color */}
      <div className="bg-white/5 border border-white/10 p-6">
        <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4">
          Primary Color
        </h2>
        <div className="grid grid-cols-6 gap-3">
          {COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setData({ ...data, primaryColor: color.value })}
              className={cn(
                "aspect-square border-2 transition-all duration-200 relative",
                data.primaryColor === color.value
                  ? "border-white scale-110"
                  : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: color.value }}
              title={color.label}
            >
              {data.primaryColor === color.value && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Check className="h-5 w-5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-white/40 text-sm mt-4">
          Selected: {COLORS.find((c) => c.value === data.primaryColor)?.label || "Custom"}
        </p>

        {/* Custom color input */}
        <div className="mt-4 flex items-center gap-3">
          <label className="text-sm text-white/60">Custom:</label>
          <input
            type="color"
            value={data.primaryColor}
            onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
            className="w-10 h-10 bg-transparent border-0 cursor-pointer"
          />
          <input
            type="text"
            value={data.primaryColor}
            onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
            placeholder="#D4A84B"
            className="w-32 px-3 py-2 bg-white/5 border border-white/20 text-white text-sm font-mono focus:border-sola-gold focus:outline-none"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white/5 border border-white/10 p-6">
        <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4">
          Preview
        </h2>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="px-6 py-3 font-display font-semibold uppercase tracking-widest text-sm text-sola-black"
            style={{ backgroundColor: data.primaryColor }}
          >
            Sample Button
          </button>
          <span style={{ color: data.primaryColor }}>Accent Text</span>
          <div
            className="w-6 h-6"
            style={{ backgroundColor: data.primaryColor }}
          />
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-sola-red/10 border border-sola-red/30 text-sola-red text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          Branding settings updated!
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  )
}
