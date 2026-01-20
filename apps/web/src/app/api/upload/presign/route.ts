import { NextRequest, NextResponse } from "next/server"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { getPresignedUploadUrl, isValidImageType } from "@/lib/r2"

/**
 * Generate a presigned URL for direct browser upload to R2
 * This is more efficient for large files as they go directly to R2
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
    const body = await request.json()
    const { filename, folder, contentType } = body

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 })
    }

    // Validate file type for images
    if (!isValidImageType(filename)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: jpg, jpeg, png, gif, webp, svg" },
        { status: 400 }
      )
    }

    // Generate presigned URL
    const validFolders = ["avatars", "logos", "banners", "posts", "courses", "lessons", "media"]
    const uploadFolder = validFolders.includes(folder) ? folder : "media"

    const result = await getPresignedUploadUrl(filename, uploadFolder as any, {
      organizationId: organization.id,
      contentType,
      expiresIn: 3600, // 1 hour
    })

    return NextResponse.json({
      success: true,
      key: result.key,
      uploadUrl: result.uploadUrl,
      publicUrl: result.publicUrl,
    })
  } catch (error) {
    console.error("Presign error:", error)

    // Check if it's an R2 credentials error
    if (error instanceof Error && error.message.includes("R2")) {
      return NextResponse.json(
        { error: "Image uploads not configured. Please set up R2 credentials." },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}
