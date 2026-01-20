import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyWebhookSignature } from "@/lib/mux"

const MUX_WEBHOOK_SECRET = process.env.MUX_WEBHOOK_SECRET || ""

interface MuxWebhookEvent {
  type: string
  object: {
    type: string
    id: string
  }
  id: string
  environment: {
    name: string
    id: string
  }
  data: Record<string, unknown>
  created_at: string
  accessor_source?: string
  accessor?: string
  request_id?: string
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("mux-signature")

  // Verify signature if secret is configured
  if (MUX_WEBHOOK_SECRET && signature) {
    const isValid = verifyWebhookSignature(body, signature, MUX_WEBHOOK_SECRET)
    if (!isValid) {
      console.error("Mux webhook signature verification failed")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }
  }

  let event: MuxWebhookEvent

  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  console.log(`Mux webhook received: ${event.type}`)

  try {
    switch (event.type) {
      // ============ ASSET EVENTS (VOD) ============
      case "video.asset.created": {
        await handleAssetCreated(event.data)
        break
      }

      case "video.asset.ready": {
        await handleAssetReady(event.data)
        break
      }

      case "video.asset.errored": {
        await handleAssetErrored(event.data)
        break
      }

      case "video.asset.deleted": {
        await handleAssetDeleted(event.data)
        break
      }

      // ============ UPLOAD EVENTS ============
      case "video.upload.asset_created": {
        await handleUploadAssetCreated(event.data)
        break
      }

      case "video.upload.errored": {
        await handleUploadErrored(event.data)
        break
      }

      case "video.upload.cancelled": {
        await handleUploadCancelled(event.data)
        break
      }

      // ============ LIVESTREAM EVENTS ============
      case "video.live_stream.created": {
        await handleLivestreamCreated(event.data)
        break
      }

      case "video.live_stream.connected": {
        await handleLivestreamConnected(event.data)
        break
      }

      case "video.live_stream.recording": {
        await handleLivestreamRecording(event.data)
        break
      }

      case "video.live_stream.active": {
        await handleLivestreamActive(event.data)
        break
      }

      case "video.live_stream.disconnected": {
        await handleLivestreamDisconnected(event.data)
        break
      }

      case "video.live_stream.idle": {
        await handleLivestreamIdle(event.data)
        break
      }

      case "video.live_stream.deleted": {
        await handleLivestreamDeleted(event.data)
        break
      }

      default:
        console.log(`Unhandled Mux event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Error processing Mux webhook ${event.type}:`, error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

// ============ ASSET HANDLERS ============

async function handleAssetCreated(data: Record<string, unknown>) {
  const assetId = data.id as string
  console.log(`Asset created: ${assetId}`)
  // Asset is being processed
}

async function handleAssetReady(data: Record<string, unknown>) {
  const assetId = data.id as string
  const playbackIds = data.playback_ids as Array<{ id: string; policy: string }> | undefined
  const duration = data.duration as number | undefined
  const playbackId = playbackIds?.[0]?.id

  console.log(`Asset ready: ${assetId}, playbackId: ${playbackId}, duration: ${duration}`)

  // Update lesson if this asset belongs to a lesson
  if (assetId) {
    const lesson = await db.lesson.findFirst({
      where: { muxAssetId: assetId },
    })

    if (lesson) {
      await db.lesson.update({
        where: { id: lesson.id },
        data: {
          muxPlaybackId: playbackId,
          videoDuration: duration ? Math.round(duration) : null,
        },
      })
      console.log(`Updated lesson ${lesson.id} with playback info`)
    }

    // Also update Media table
    const media = await db.media.findFirst({
      where: { muxAssetId: assetId },
    })

    if (media) {
      await db.media.update({
        where: { id: media.id },
        data: {
          muxPlaybackId: playbackId,
          duration: duration ? Math.round(duration) : null,
        },
      })
      console.log(`Updated media ${media.id} with playback info`)
    }
  }
}

async function handleAssetErrored(data: Record<string, unknown>) {
  const assetId = data.id as string
  const errors = data.errors as { type: string; messages: string[] } | undefined
  console.error(`Asset errored: ${assetId}`, errors)
  // Could notify user about failed upload
}

async function handleAssetDeleted(data: Record<string, unknown>) {
  const assetId = data.id as string
  console.log(`Asset deleted: ${assetId}`)

  // Clean up references in database
  await db.lesson.updateMany({
    where: { muxAssetId: assetId },
    data: {
      muxAssetId: null,
      muxPlaybackId: null,
      videoDuration: null,
    },
  })

  await db.media.deleteMany({
    where: { muxAssetId: assetId },
  })
}

// ============ UPLOAD HANDLERS ============

async function handleUploadAssetCreated(data: Record<string, unknown>) {
  const uploadId = data.id as string
  const assetId = data.asset_id as string
  console.log(`Upload complete, asset created: ${assetId} from upload ${uploadId}`)
}

async function handleUploadErrored(data: Record<string, unknown>) {
  const uploadId = data.id as string
  const error = data.error as { type: string; message: string } | undefined
  console.error(`Upload errored: ${uploadId}`, error)
}

async function handleUploadCancelled(data: Record<string, unknown>) {
  const uploadId = data.id as string
  console.log(`Upload cancelled: ${uploadId}`)
}

// ============ LIVESTREAM HANDLERS ============

async function handleLivestreamCreated(data: Record<string, unknown>) {
  const streamId = data.id as string
  console.log(`Livestream created: ${streamId}`)
}

async function handleLivestreamConnected(data: Record<string, unknown>) {
  const streamId = data.id as string
  console.log(`Livestream connected: ${streamId}`)

  // Update livestream status in database
  const livestream = await db.livestream.findFirst({
    where: {
      OR: [
        { muxLiveStreamId: streamId },
        { muxPlaybackId: streamId },
      ],
    },
  })

  if (livestream) {
    await db.livestream.update({
      where: { id: livestream.id },
      data: {
        status: "LIVE",
        startedAt: new Date(),
      },
    })
  }
}

async function handleLivestreamRecording(data: Record<string, unknown>) {
  const streamId = data.id as string
  console.log(`Livestream recording: ${streamId}`)
}

async function handleLivestreamActive(data: Record<string, unknown>) {
  const streamId = data.id as string
  console.log(`Livestream active: ${streamId}`)
}

async function handleLivestreamDisconnected(data: Record<string, unknown>) {
  const streamId = data.id as string
  console.log(`Livestream disconnected: ${streamId}`)
}

async function handleLivestreamIdle(data: Record<string, unknown>) {
  const streamId = data.id as string
  const recentAssetIds = data.recent_asset_ids as string[] | undefined

  console.log(`Livestream idle: ${streamId}`)

  // Find and update the livestream
  const livestream = await db.livestream.findFirst({
    where: {
      OR: [
        { muxLiveStreamId: streamId },
        { muxPlaybackId: streamId },
      ],
    },
  })

  if (livestream) {
    // Get the recording asset ID
    const recordingAssetId = recentAssetIds?.[0]

    await db.livestream.update({
      where: { id: livestream.id },
      data: {
        status: "ENDED",
        endedAt: new Date(),
        muxAssetId: recordingAssetId,
      },
    })
    console.log(`Updated livestream ${livestream.id} to ENDED`)
  }
}

async function handleLivestreamDeleted(data: Record<string, unknown>) {
  const streamId = data.id as string
  console.log(`Livestream deleted: ${streamId}`)
}
