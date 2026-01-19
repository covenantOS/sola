import Mux from '@mux/mux-node'
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'

// ==================== MUX (Video Hosting) ====================

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

export { mux }

// Create a direct upload URL for browser uploads
export async function createDirectUpload(corsOrigin?: string) {
  const upload = await mux.video.uploads.create({
    cors_origin: corsOrigin || process.env.NEXT_PUBLIC_APP_URL || '*',
    new_asset_settings: {
      playback_policy: ['signed'],
      encoding_tier: 'baseline',
    },
  })
  return {
    uploadId: upload.id,
    uploadUrl: upload.url,
  }
}

// Get asset details
export async function getAsset(assetId: string) {
  const asset = await mux.video.assets.retrieve(assetId)
  return asset
}

// Create signed playback token for private videos
export async function createPlaybackToken(playbackId: string) {
  // Note: Requires Mux signing key to be configured
  const signingKeyId = process.env.MUX_SIGNING_KEY_ID
  const signingKeySecret = process.env.MUX_SIGNING_KEY_SECRET

  if (!signingKeyId || !signingKeySecret) {
    throw new Error('Mux signing keys not configured')
  }

  const token = await mux.jwt.signPlaybackId(playbackId, {
    keyId: signingKeyId,
    keySecret: signingKeySecret,
    expiration: '2h',
  })

  return token
}

// Delete an asset
export async function deleteAsset(assetId: string) {
  await mux.video.assets.delete(assetId)
}

// ==================== LIVEKIT (Livestreaming) ====================

const livekitHost = process.env.LIVEKIT_URL!
const livekitApiKey = process.env.LIVEKIT_API_KEY!
const livekitApiSecret = process.env.LIVEKIT_API_SECRET!

const roomService = new RoomServiceClient(
  livekitHost,
  livekitApiKey,
  livekitApiSecret
)

export { roomService }

// Create a new LiveKit room
export async function createRoom(roomName: string, options?: {
  emptyTimeout?: number
  maxParticipants?: number
}) {
  const room = await roomService.createRoom({
    name: roomName,
    emptyTimeout: options?.emptyTimeout || 600, // 10 minutes
    maxParticipants: options?.maxParticipants || 100,
  })
  return room
}

// Delete a room
export async function deleteRoom(roomName: string) {
  await roomService.deleteRoom(roomName)
}

// List all rooms
export async function listRooms() {
  const rooms = await roomService.listRooms()
  return rooms
}

// Generate access token for joining a room
export async function createRoomToken({
  roomName,
  participantName,
  participantIdentity,
  isHost = false,
}: {
  roomName: string
  participantName: string
  participantIdentity: string
  isHost?: boolean
}) {
  const at = new AccessToken(livekitApiKey, livekitApiSecret, {
    identity: participantIdentity,
    name: participantName,
  })

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: isHost,
    canSubscribe: true,
    canPublishData: true,
  })

  return at.toJwt()
}

// Start recording a room to Mux
export async function startRoomRecording(roomName: string) {
  // LiveKit Egress API would be used here
  // This requires additional setup for egress configuration
  throw new Error('Recording not yet implemented - requires LiveKit Egress setup')
}
