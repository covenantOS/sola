import { Server as SocketServer, Socket } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { Redis } from 'ioredis'
import type { Server as HttpServer } from 'http'

export interface RealtimeConfig {
  redisUrl: string
  corsOrigin: string | string[]
}

export function createRealtimeServer(httpServer: HttpServer, config: RealtimeConfig) {
  // Create Redis clients for pub/sub
  const pubClient = new Redis(config.redisUrl)
  const subClient = pubClient.duplicate()

  // Create Socket.IO server with Redis adapter for horizontal scaling
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
    },
  })

  // Use Redis adapter for scaling across multiple servers
  io.adapter(createAdapter(pubClient, subClient))

  // Community namespace for posts, comments, reactions
  const communityNs = io.of('/community')

  communityNs.on('connection', (socket: Socket) => {
    console.log('User connected to community:', socket.id)

    // Join a channel room
    socket.on('join:channel', (channelId: string) => {
      socket.join(`channel:${channelId}`)
      console.log(`User ${socket.id} joined channel:${channelId}`)
    })

    // Leave a channel room
    socket.on('leave:channel', (channelId: string) => {
      socket.leave(`channel:${channelId}`)
    })

    // New post in channel
    socket.on('post:new', (data: { channelId: string; post: unknown }) => {
      socket.to(`channel:${data.channelId}`).emit('post:created', data.post)
    })

    // Post updated
    socket.on('post:update', (data: { channelId: string; post: unknown }) => {
      socket.to(`channel:${data.channelId}`).emit('post:updated', data.post)
    })

    // Post deleted
    socket.on('post:delete', (data: { channelId: string; postId: string }) => {
      socket.to(`channel:${data.channelId}`).emit('post:deleted', data.postId)
    })

    // New comment
    socket.on('comment:new', (data: { channelId: string; comment: unknown }) => {
      socket.to(`channel:${data.channelId}`).emit('comment:created', data.comment)
    })

    // Reaction added
    socket.on('reaction:add', (data: { channelId: string; reaction: unknown }) => {
      socket.to(`channel:${data.channelId}`).emit('reaction:added', data.reaction)
    })

    // User typing indicator
    socket.on('typing:start', (data: { channelId: string; userId: string }) => {
      socket.to(`channel:${data.channelId}`).emit('user:typing', { userId: data.userId })
    })

    socket.on('typing:stop', (data: { channelId: string; userId: string }) => {
      socket.to(`channel:${data.channelId}`).emit('user:stopped-typing', { userId: data.userId })
    })

    socket.on('disconnect', () => {
      console.log('User disconnected from community:', socket.id)
    })
  })

  // DM namespace for direct messages
  const dmNs = io.of('/messages')

  dmNs.on('connection', (socket: Socket) => {
    console.log('User connected to messages:', socket.id)

    // Join a conversation room
    socket.on('join:conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`)
    })

    // Leave a conversation room
    socket.on('leave:conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`)
    })

    // New message
    socket.on('message:new', (data: { conversationId: string; message: unknown }) => {
      socket.to(`conversation:${data.conversationId}`).emit('message:created', data.message)
    })

    // Message read
    socket.on('message:read', (data: { conversationId: string; userId: string; messageId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('message:read', data)
    })

    // Typing indicator
    socket.on('typing:start', (data: { conversationId: string; userId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user:typing', { userId: data.userId })
    })

    socket.on('disconnect', () => {
      console.log('User disconnected from messages:', socket.id)
    })
  })

  return io
}

// Utility to emit from server-side (e.g., from API routes after database changes)
export function emitToChannel(io: SocketServer, channelId: string, event: string, data: unknown) {
  io.of('/community').to(`channel:${channelId}`).emit(event, data)
}

export function emitToConversation(io: SocketServer, conversationId: string, event: string, data: unknown) {
  io.of('/messages').to(`conversation:${conversationId}`).emit(event, data)
}
