import { NextRequest, NextResponse } from "next/server"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { uploadFile, isValidImageType, getMaxFileSize } from "@/lib/r2"

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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string) || "media"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!isValidImageType(file.name)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: jpg, jpeg, png, gif, webp, svg" },
        { status: 400 }
      )
    }

    // Validate file size
    const maxSize = getMaxFileSize("image")
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to R2
    const validFolders = ["avatars", "logos", "banners", "posts", "courses", "lessons", "media"]
    const uploadFolder = validFolders.includes(folder) ? folder : "media"

    const result = await uploadFile(buffer, file.name, uploadFolder as any, {
      organizationId: organization.id,
      contentType: file.type,
    })

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
    })
  } catch (error) {
    console.error("Image upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    )
  }
}
