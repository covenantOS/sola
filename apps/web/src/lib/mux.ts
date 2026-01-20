import Mux from "@mux/mux-node"
import crypto from "crypto"

// Lazy initialize Mux client to avoid build-time errors
let _mux: Mux | null = null

function getMux(): Mux {
  if (!_mux) {
    const tokenId = process.env.MUX_TOKEN_ID
    const tokenSecret = process.env.MUX_TOKEN_SECRET

    if (!tokenId || !tokenSecret) {
      throw new Error("MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables are required")
    }

    _mux = new Mux({
      tokenId,
      tokenSecret,
    })
  }
  return _mux
}

export { getMux as mux }

// ==================== VIDEO ON DEMAND (VOD) ====================

// Create a direct upload URL for browser uploads
export async function createDirectUpload(options?: {
  corsOrigin?: string
  isPrivate?: boolean
}) {
  const upload = await getMux().video.uploads.create({
    cors_origin: options?.corsOrigin || process.env.NEXT_PUBLIC_APP_URL || "*",
    new_asset_settings: {
      playback_policy: [options?.isPrivate ? "signed" : "public"],
      encoding_tier: "baseline",
    },
  })
  return {
    uploadId: upload.id,
    uploadUrl: upload.url,
  }
}

// Get asset details
export async function getAsset(assetId: string) {
  const asset = await getMux().video.assets.retrieve(assetId)
  return asset
}

// Get playback URL for an asset
export function getPlaybackUrl(
  playbackId: string,
  type: "hls" | "thumbnail" = "hls"
) {
  if (type === "thumbnail") {
    return `https://image.mux.com/${playbackId}/thumbnail.jpg`
  }
  return `https://stream.mux.com/${playbackId}.m3u8`
}

// Create signed playback token for private videos
export async function createPlaybackToken(
  playbackId: string,
  expiresIn = "2h"
) {
  const signingKeyId = process.env.MUX_SIGNING_KEY_ID
  const signingKeySecret = process.env.MUX_SIGNING_KEY_SECRET

  if (!signingKeyId || !signingKeySecret) {
    throw new Error("Mux signing keys not configured for private playback")
  }

  const token = await getMux().jwt.signPlaybackId(playbackId, {
    keyId: signingKeyId,
    keySecret: signingKeySecret,
    expiration: expiresIn,
  })

  return token
}

// Delete an asset
export async function deleteAsset(assetId: string) {
  await getMux().video.assets.delete(assetId)
}

// ==================== LIVESTREAMING ====================

// Create a new livestream
export async function createLivestream(options?: {
  playbackPolicy?: "public" | "signed"
  reconnectWindow?: number // seconds, default 60
  latencyMode?: "low" | "reduced" | "standard"
}) {
  const livestream = await getMux().video.liveStreams.create({
    playback_policy: [options?.playbackPolicy || "public"],
    new_asset_settings: {
      playback_policy: [options?.playbackPolicy || "public"],
    },
    reconnect_window: options?.reconnectWindow || 60,
    latency_mode: options?.latencyMode || "low",
  })

  return {
    id: livestream.id,
    streamKey: livestream.stream_key,
    playbackIds: livestream.playback_ids,
    rtmpUrl: "rtmps://global-live.mux.com:443/app",
    status: livestream.status,
  }
}

// Get livestream details
export async function getLivestream(livestreamId: string) {
  const livestream = await getMux().video.liveStreams.retrieve(livestreamId)
  return {
    id: livestream.id,
    streamKey: livestream.stream_key,
    playbackIds: livestream.playback_ids,
    status: livestream.status,
    activeAssetId: livestream.active_asset_id,
    recentAssetIds: livestream.recent_asset_ids,
  }
}

// Reset stream key (if compromised)
export async function resetStreamKey(livestreamId: string) {
  const livestream = await getMux().video.liveStreams.resetStreamKey(livestreamId)
  return livestream.stream_key
}

// Signal livestream is complete
export async function completeLivestream(livestreamId: string) {
  await getMux().video.liveStreams.complete(livestreamId)
}

// Delete a livestream
export async function deleteLivestream(livestreamId: string) {
  await getMux().video.liveStreams.delete(livestreamId)
}

// Enable/disable a livestream
export async function enableLivestream(livestreamId: string) {
  await getMux().video.liveStreams.enable(livestreamId)
}

export async function disableLivestream(livestreamId: string) {
  await getMux().video.liveStreams.disable(livestreamId)
}

// Get live playback URL
export function getLivePlaybackUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`
}

// ==================== WEBHOOK HELPERS ====================

// Verify Mux webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
  return signature === expectedSignature
}
