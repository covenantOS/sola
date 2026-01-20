/**
 * Cloudflare R2 Storage Client
 *
 * Handles image and file uploads to R2 (S3-compatible storage)
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { v4 as uuidv4 } from "uuid"

// Lazy initialize R2 client
let _r2Client: S3Client | null = null

function getR2Client(): S3Client {
  if (!_r2Client) {
    const accountId = process.env.R2_ACCOUNT_ID
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error("R2 credentials not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY")
    }

    _r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  }
  return _r2Client
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "sola-media"
const PUBLIC_URL = process.env.R2_PUBLIC_URL || ""

export type UploadFolder = "avatars" | "logos" | "banners" | "posts" | "courses" | "lessons" | "media"

/**
 * Generate a unique key for file storage
 */
function generateKey(folder: UploadFolder, filename: string, organizationId?: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "bin"
  const uniqueId = uuidv4()

  if (organizationId) {
    return `${folder}/${organizationId}/${uniqueId}.${ext}`
  }
  return `${folder}/${uniqueId}.${ext}`
}

/**
 * Upload a file to R2
 */
export async function uploadFile(
  file: Buffer | Uint8Array,
  filename: string,
  folder: UploadFolder,
  options?: {
    organizationId?: string
    contentType?: string
  }
): Promise<{ key: string; url: string }> {
  const key = generateKey(folder, filename, options?.organizationId)

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: options?.contentType || getMimeType(filename),
  })

  await getR2Client().send(command)

  const url = PUBLIC_URL ? `${PUBLIC_URL}/${key}` : key

  return { key, url }
}

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await getR2Client().send(command)
}

/**
 * Generate a presigned URL for direct upload from browser
 */
export async function getPresignedUploadUrl(
  filename: string,
  folder: UploadFolder,
  options?: {
    organizationId?: string
    contentType?: string
    expiresIn?: number // seconds, default 3600
  }
): Promise<{ key: string; uploadUrl: string; publicUrl: string }> {
  const key = generateKey(folder, filename, options?.organizationId)

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: options?.contentType || getMimeType(filename),
  })

  const uploadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: options?.expiresIn || 3600,
  })

  const publicUrl = PUBLIC_URL ? `${PUBLIC_URL}/${key}` : key

  return { key, uploadUrl, publicUrl }
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase()

  const mimeTypes: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    ico: "image/x-icon",

    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    // Audio
    mp3: "audio/mpeg",
    wav: "audio/wav",

    // Video (though we use Mux for video)
    mp4: "video/mp4",
    webm: "video/webm",

    // Other
    json: "application/json",
    txt: "text/plain",
    zip: "application/zip",
  }

  return mimeTypes[ext || ""] || "application/octet-stream"
}

/**
 * Validate file type
 */
export function isValidImageType(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase()
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")
}

export function isValidVideoType(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase()
  return ["mp4", "webm", "mov", "avi", "mkv"].includes(ext || "")
}

/**
 * Get max file size by type (in bytes)
 */
export function getMaxFileSize(type: "image" | "video" | "document"): number {
  switch (type) {
    case "image":
      return 10 * 1024 * 1024 // 10MB
    case "video":
      return 5 * 1024 * 1024 * 1024 // 5GB (via Mux)
    case "document":
      return 50 * 1024 * 1024 // 50MB
    default:
      return 10 * 1024 * 1024
  }
}
