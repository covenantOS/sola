import { NextRequest, NextResponse } from "next/server"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { createDirectUpload } from "@/lib/mux"

/**
 * Create a Mux direct upload URL
 * Client uploads directly to Mux, then we get webhook when ready
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { claims } = await getLogtoContext(logtoConfig)
    if (!claims?.sub) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { organization } = await getUserWithOrganization(claims.sub)
    if (!organization) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 })
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const isPrivate = body.isPrivate || false

    // Create Mux direct upload URL
    const upload = await createDirectUpload({
      corsOrigin: process.env.NEXT_PUBLIC_APP_URL || "*",
      isPrivate,
    })

    return NextResponse.json({
      success: true,
      uploadId: upload.uploadId,
      uploadUrl: upload.uploadUrl,
    })
  } catch (error) {
    console.error("Video upload error:", error)

    // Check if it's a Mux credentials error
    if (error instanceof Error && error.message.includes("MUX_TOKEN")) {
      return NextResponse.json(
        { error: "Video uploads not configured. Please set up Mux credentials." },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create video upload" },
      { status: 500 }
    )
  }
}
