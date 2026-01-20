"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Upload, Eye, Save, Loader2, Image as ImageIcon, Type, Palette, Layout } from "lucide-react"

type AppearanceSettings = {
  heroImage: string
  heroTitle: string
  heroSubtitle: string
  primaryColor: string
  secondaryColor: string
  darkMode: boolean
  showAbout: boolean
  showTiers: boolean
  showCourses: boolean
  showPosts: boolean
  aboutTitle: string
  aboutContent: string
  sectionOrder: string[]
}

const defaultSettings: AppearanceSettings = {
  heroImage: "",
  heroTitle: "",
  heroSubtitle: "",
  primaryColor: "#D4A84B",
  secondaryColor: "#1A1B23",
  darkMode: true,
  showAbout: true,
  showTiers: true,
  showCourses: true,
  showPosts: true,
  aboutTitle: "About",
  aboutContent: "",
  sectionOrder: ["about", "tiers", "courses", "posts"],
}

export default function AppearancePage() {
  const [settings, setSettings] = useState<AppearanceSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [orgSlug, setOrgSlug] = useState("")

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/organization/appearance")
        const data = await res.json()
        if (data.settings) {
          setSettings({ ...defaultSettings, ...data.settings })
        }
        if (data.slug) {
          setOrgSlug(data.slug)
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch("/api/organization/appearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "heroImage") => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "image")

    try {
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setSettings((prev) => ({ ...prev, [field]: data.url }))
      }
    } catch (error) {
      console.error("Failed to upload image:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 text-sola-gold animate-spin" />
      </div>
    )
  }

  const previewUrl = orgSlug
    ? `https://${orgSlug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "solaplus.ai"}`
    : "#"

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
              Appearance
            </h1>
            <p className="text-white/60 mt-1">
              Customize how your public community page looks.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
            >
              <Eye className="h-4 w-4" />
              Preview
            </a>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-sola-gold text-sola-black px-4 py-2 font-display font-semibold uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="bg-white/5 border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-5 w-5 text-sola-gold" />
              <h2 className="font-display text-white uppercase tracking-wide">Hero Section</h2>
            </div>

            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
                Hero Image
              </label>
              {settings.heroImage ? (
                <div className="relative">
                  <img
                    src={settings.heroImage}
                    alt="Hero"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    onClick={() => setSettings((prev) => ({ ...prev, heroImage: "" }))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/20 hover:border-sola-gold/50 cursor-pointer transition-colors">
                  <Upload className="h-8 w-8 text-white/40 mb-2" />
                  <span className="text-white/60 text-sm">Upload hero image</span>
                  <span className="text-white/40 text-xs">Recommended: 1920x600</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "heroImage")}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
                Hero Title
              </label>
              <input
                type="text"
                value={settings.heroTitle}
                onChange={(e) => setSettings((prev) => ({ ...prev, heroTitle: e.target.value }))}
                placeholder="Welcome to my community"
                className="w-full bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
                Hero Subtitle
              </label>
              <textarea
                value={settings.heroSubtitle}
                onChange={(e) => setSettings((prev) => ({ ...prev, heroSubtitle: e.target.value }))}
                placeholder="Join thousands of members learning together..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white/5 border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-sola-gold" />
              <h2 className="font-display text-white uppercase tracking-wide">Colors</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings((prev) => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-12 h-10 bg-transparent border border-white/10 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings((prev) => ({ ...prev, primaryColor: e.target.value }))}
                    className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-white text-sm focus:border-sola-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
                  Background Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-12 h-10 bg-transparent border border-white/10 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                    className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-white text-sm focus:border-sola-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div>
                <p className="text-white">Dark Mode</p>
                <p className="text-xs text-white/40">Use dark background for your page</p>
              </div>
              <button
                onClick={() => setSettings((prev) => ({ ...prev, darkMode: !prev.darkMode }))}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.darkMode ? "bg-sola-gold" : "bg-white/20"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.darkMode ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Sections */}
          <div className="bg-white/5 border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Layout className="h-5 w-5 text-sola-gold" />
              <h2 className="font-display text-white uppercase tracking-wide">Sections</h2>
            </div>

            <p className="text-white/60 text-sm mb-4">
              Choose which sections appear on your public page.
            </p>

            {[
              { key: "showAbout", label: "About Section", desc: "Tell visitors about your community" },
              { key: "showTiers", label: "Membership Tiers", desc: "Display pricing and benefits" },
              { key: "showCourses", label: "Courses", desc: "Showcase your courses" },
              { key: "showPosts", label: "Recent Posts", desc: "Show recent community activity" },
            ].map((section) => (
              <div
                key={section.key}
                className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
              >
                <div>
                  <p className="text-white">{section.label}</p>
                  <p className="text-xs text-white/40">{section.desc}</p>
                </div>
                <button
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      [section.key]: !prev[section.key as keyof AppearanceSettings],
                    }))
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings[section.key as keyof AppearanceSettings] ? "bg-sola-gold" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      settings[section.key as keyof AppearanceSettings]
                        ? "translate-x-6"
                        : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* About Content */}
          {settings.showAbout && (
            <div className="bg-white/5 border border-white/10 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Type className="h-5 w-5 text-sola-gold" />
                <h2 className="font-display text-white uppercase tracking-wide">About Content</h2>
              </div>

              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
                  Section Title
                </label>
                <input
                  type="text"
                  value={settings.aboutTitle}
                  onChange={(e) => setSettings((prev) => ({ ...prev, aboutTitle: e.target.value }))}
                  placeholder="About"
                  className="w-full bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
                  Content
                </label>
                <textarea
                  value={settings.aboutContent}
                  onChange={(e) => setSettings((prev) => ({ ...prev, aboutContent: e.target.value }))}
                  placeholder="Tell visitors what your community is about..."
                  rows={6}
                  className="w-full bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="bg-white/5 border border-white/10 p-4">
            <h3 className="font-display text-sm text-white/60 uppercase tracking-wide mb-4">
              Preview
            </h3>
            <div
              className="aspect-[9/16] max-h-[600px] overflow-hidden"
              style={{ backgroundColor: settings.secondaryColor }}
            >
              {/* Mini preview of the page */}
              <div className="h-full flex flex-col">
                {/* Hero */}
                <div
                  className="h-24 relative"
                  style={{
                    backgroundImage: settings.heroImage ? `url(${settings.heroImage})` : undefined,
                    backgroundColor: settings.heroImage ? undefined : settings.primaryColor + "20",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4">
                    <h2
                      className="font-display text-sm text-white text-center uppercase tracking-wide"
                      style={{ color: settings.darkMode ? "white" : settings.secondaryColor }}
                    >
                      {settings.heroTitle || "Your Community"}
                    </h2>
                    {settings.heroSubtitle && (
                      <p className="text-[10px] text-white/60 text-center mt-1 line-clamp-2">
                        {settings.heroSubtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Sections */}
                <div className="flex-1 p-3 space-y-3">
                  {settings.showAbout && (
                    <div className="bg-white/5 p-2">
                      <p className="text-[8px] font-display uppercase" style={{ color: settings.primaryColor }}>
                        {settings.aboutTitle || "About"}
                      </p>
                      <div className="h-6 bg-white/10 mt-1" />
                    </div>
                  )}
                  {settings.showTiers && (
                    <div className="bg-white/5 p-2">
                      <p className="text-[8px] font-display uppercase" style={{ color: settings.primaryColor }}>
                        Membership
                      </p>
                      <div className="flex gap-1 mt-1">
                        <div className="h-8 flex-1 bg-white/10" />
                        <div className="h-8 flex-1 bg-white/10" />
                      </div>
                    </div>
                  )}
                  {settings.showCourses && (
                    <div className="bg-white/5 p-2">
                      <p className="text-[8px] font-display uppercase" style={{ color: settings.primaryColor }}>
                        Courses
                      </p>
                      <div className="flex gap-1 mt-1">
                        <div className="h-6 flex-1 bg-white/10" />
                        <div className="h-6 flex-1 bg-white/10" />
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="p-3">
                  <div
                    className="h-6 flex items-center justify-center"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    <span className="text-[8px] font-display uppercase text-black">Join Now</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
