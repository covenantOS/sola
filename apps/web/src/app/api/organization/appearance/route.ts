import { NextRequest, NextResponse } from "next/server"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const { claims } = await getLogtoContext(logtoConfig)
    const { organization } = await getUserWithOrganization(claims?.sub || "")

    if (!organization) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const settings = (organization.settings as Record<string, unknown>) || {}
    const appearance = settings.appearance || {}

    return NextResponse.json({
      settings: appearance,
      slug: organization.slug,
    })
  } catch (error) {
    console.error("Failed to get appearance settings:", error)
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { claims } = await getLogtoContext(logtoConfig)
    const { organization } = await getUserWithOrganization(claims?.sub || "")

    if (!organization) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { settings: appearanceSettings } = await request.json()

    // Merge with existing settings
    const currentSettings = (organization.settings as Record<string, unknown>) || {}
    const newSettings = {
      ...currentSettings,
      appearance: appearanceSettings,
      // Also update top-level primaryColor for backwards compatibility
      primaryColor: appearanceSettings.primaryColor || currentSettings.primaryColor,
    }

    await db.organization.update({
      where: { id: organization.id },
      data: { settings: newSettings },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save appearance settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
