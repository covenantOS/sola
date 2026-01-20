"use client"
export const dynamic = "force-dynamic"


import { useState, useEffect } from "react"
import {
  Palette,
  Type,
  Image,
  Layout,
  Save,
  Eye,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  GripVertical,
} from "lucide-react"
import Link from "next/link"

type Section = {
  id: string
  type: string
  settings: Record<string, any>
}

const sectionTypes = [
  { type: "hero", label: "Hero", icon: Image },
  { type: "about", label: "About", icon: Type },
  { type: "tiers", label: "Membership Tiers", icon: Layout },
  { type: "courses", label: "Featured Courses", icon: Layout },
  { type: "posts", label: "Recent Posts", icon: Layout },
  { type: "cta", label: "Call to Action", icon: Layout },
]

export default function AppearancePage() {
  const [sections, setSections] = useState<Section[]>([
    {
      id: "1",
      type: "hero",
      settings: {
        headline: "Welcome to Our Community",
        subheadline: "Join thousands of members growing together",
        ctaText: "Join Now",
        backgroundType: "color",
        backgroundColor: "#0D0D0D",
      },
    },
    {
      id: "2",
      type: "tiers",
      settings: {
        title: "Choose Your Membership",
        showPrices: true,
      },
    },
    {
      id: "3",
      type: "about",
      settings: {
        title: "About Us",
        content: "We are a community dedicated to helping you grow.",
      },
    },
  ])

  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [colors, setColors] = useState({
    primary: "#D4A84B",
    secondary: "#ED1C24",
    background: "#0D0D0D",
    text: "#FFFFFF",
  })
  const [saving, setSaving] = useState(false)

  const addSection = (type: string) => {
    const newSection: Section = {
      id: Date.now().toString(),
      type,
      settings: {},
    }
    setSections([...sections, newSection])
    setSelectedSection(newSection.id)
  }

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id))
    if (selectedSection === id) {
      setSelectedSection(null)
    }
  }

  const moveSection = (id: string, direction: "up" | "down") => {
    const index = sections.findIndex((s) => s.id === id)
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === sections.length - 1)
    ) {
      return
    }

    const newSections = [...sections]
    const newIndex = direction === "up" ? index - 1 : index + 1
    ;[newSections[index], newSections[newIndex]] = [
      newSections[newIndex],
      newSections[index],
    ]
    setSections(newSections)
  }

  const updateSectionSettings = (id: string, settings: Record<string, any>) => {
    setSections(
      sections.map((s) =>
        s.id === id ? { ...s, settings: { ...s.settings, ...settings } } : s
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    // Save to API (would implement in production)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
  }

  const currentSection = sections.find((s) => s.id === selectedSection)

  return (
    <div className="h-[calc(100vh-120px)] flex -mx-6 -my-6">
      {/* Components Panel */}
      <div className="w-64 bg-white/5 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-display text-lg text-white uppercase tracking-wide">
            Components
          </h2>
        </div>

        <div className="p-4 space-y-2">
          {sectionTypes.map((item) => (
            <button
              key={item.type}
              onClick={() => addSection(item.type)}
              className="w-full flex items-center gap-3 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <item.icon className="h-4 w-4" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto p-4 border-t border-white/10">
          <h3 className="font-display text-sm text-white/50 uppercase tracking-wide mb-4">
            Colors
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Primary</span>
              <input
                type="color"
                value={colors.primary}
                onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Secondary</span>
              <input
                type="color"
                value={colors.secondary}
                onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Background</span>
              <input
                type="color"
                value={colors.background}
                onChange={(e) => setColors({ ...colors, background: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h1 className="font-display text-xl text-white uppercase tracking-wide">
            Page Builder
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/your-community"
              target="_blank"
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-2 text-sm disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-sola-dark-navy">
          <div
            className="max-w-4xl mx-auto space-y-4"
            style={{ backgroundColor: colors.background }}
          >
            {sections.map((section, index) => (
              <div
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={`relative group border-2 transition-colors cursor-pointer ${
                  selectedSection === section.id
                    ? "border-sola-gold"
                    : "border-transparent hover:border-white/20"
                }`}
              >
                {/* Section Controls */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-sola-dark-navy border border-white/10 px-2 py-1 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      moveSection(section.id, "up")
                    }}
                    disabled={index === 0}
                    className="p-1 text-white/40 hover:text-white disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      moveSection(section.id, "down")
                    }}
                    disabled={index === sections.length - 1}
                    className="p-1 text-white/40 hover:text-white disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSection(section.id)
                    }}
                    className="p-1 text-white/40 hover:text-sola-red"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Section Preview */}
                <div className="p-8 bg-white/5 min-h-[120px] flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-white/30 text-sm uppercase tracking-wide">
                      {sectionTypes.find((t) => t.type === section.type)?.label ||
                        section.type}
                    </span>
                    {section.settings.headline && (
                      <h2
                        className="font-display text-2xl mt-2 uppercase tracking-wide"
                        style={{ color: colors.primary }}
                      >
                        {section.settings.headline}
                      </h2>
                    )}
                    {section.settings.title && (
                      <h3
                        className="font-display text-xl mt-2 uppercase tracking-wide"
                        style={{ color: colors.text }}
                      >
                        {section.settings.title}
                      </h3>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {sections.length === 0 && (
              <div className="p-12 border-2 border-dashed border-white/10 text-center">
                <p className="text-white/40">
                  Click a component on the left to add it to your page
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="w-80 bg-white/5 border-l border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-display text-lg text-white uppercase tracking-wide">
            Settings
          </h2>
        </div>

        {currentSection ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <p className="text-white/50 text-sm uppercase tracking-wide">
              {sectionTypes.find((t) => t.type === currentSection.type)?.label}
            </p>

            {/* Hero Settings */}
            {currentSection.type === "hero" && (
              <>
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={currentSection.settings.headline || ""}
                    onChange={(e) =>
                      updateSectionSettings(currentSection.id, {
                        headline: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 px-3 py-2 text-white focus:border-sola-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                    Subheadline
                  </label>
                  <textarea
                    value={currentSection.settings.subheadline || ""}
                    onChange={(e) =>
                      updateSectionSettings(currentSection.id, {
                        subheadline: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 px-3 py-2 text-white focus:border-sola-gold focus:outline-none resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={currentSection.settings.ctaText || ""}
                    onChange={(e) =>
                      updateSectionSettings(currentSection.id, {
                        ctaText: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 px-3 py-2 text-white focus:border-sola-gold focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* About Settings */}
            {currentSection.type === "about" && (
              <>
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={currentSection.settings.title || ""}
                    onChange={(e) =>
                      updateSectionSettings(currentSection.id, {
                        title: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 px-3 py-2 text-white focus:border-sola-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                    Content
                  </label>
                  <textarea
                    value={currentSection.settings.content || ""}
                    onChange={(e) =>
                      updateSectionSettings(currentSection.id, {
                        content: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 px-3 py-2 text-white focus:border-sola-gold focus:outline-none resize-none"
                    rows={4}
                  />
                </div>
              </>
            )}

            {/* Tiers Settings */}
            {currentSection.type === "tiers" && (
              <>
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={currentSection.settings.title || ""}
                    onChange={(e) =>
                      updateSectionSettings(currentSection.id, {
                        title: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 px-3 py-2 text-white focus:border-sola-gold focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showPrices"
                    checked={currentSection.settings.showPrices !== false}
                    onChange={(e) =>
                      updateSectionSettings(currentSection.id, {
                        showPrices: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="showPrices" className="text-white/60 text-sm">
                    Show prices
                  </label>
                </div>
              </>
            )}

            {/* CTA Settings */}
            {currentSection.type === "cta" && (
              <>
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={currentSection.settings.headline || ""}
                    onChange={(e) =>
                      updateSectionSettings(currentSection.id, {
                        headline: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 px-3 py-2 text-white focus:border-sola-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={currentSection.settings.buttonText || ""}
                    onChange={(e) =>
                      updateSectionSettings(currentSection.id, {
                        buttonText: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 px-3 py-2 text-white focus:border-sola-gold focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-white/40 text-center text-sm">
              Select a section to edit its settings
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
