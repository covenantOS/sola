"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Send } from "lucide-react"

type Message = {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  timestamp: Date
}

type Props = {
  streamId: string
  userId: string
  userName: string
  userAvatar?: string
}

export function LiveChat({ streamId, userId, userName, userAvatar }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Simulated message polling (in production, use WebSocket)
  useEffect(() => {
    // Add a welcome message
    setMessages([
      {
        id: "welcome",
        userId: "system",
        userName: "System",
        content: "Welcome to the live chat! Be respectful and enjoy the stream.",
        timestamp: new Date(),
      },
    ])

    // In production, connect to Socket.IO or similar
    // const socket = io(SOCKET_URL)
    // socket.emit("join-stream", streamId)
    // socket.on("chat-message", (msg) => setMessages(prev => [...prev, msg]))
    // return () => socket.disconnect()
  }, [streamId])

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)

    const message: Message = {
      id: Date.now().toString(),
      userId,
      userName,
      userAvatar,
      content: newMessage.trim(),
      timestamp: new Date(),
    }

    // In production, send via WebSocket
    // socket.emit("send-message", { streamId, message })

    setMessages((prev) => [...prev, message])
    setNewMessage("")
    setSending(false)
  }, [newMessage, sending, userId, userName, userAvatar])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.userId === "system" ? "justify-center" : ""}`}
          >
            {msg.userId === "system" ? (
              <p className="text-white/40 text-xs text-center px-4 py-2 bg-white/5 rounded">
                {msg.content}
              </p>
            ) : (
              <>
                <div className="w-8 h-8 bg-sola-gold/20 flex-shrink-0 flex items-center justify-center">
                  {msg.userAvatar ? (
                    <img
                      src={msg.userAvatar}
                      alt={msg.userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-display text-sola-gold">
                      {msg.userName[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-display uppercase tracking-wide ${
                        msg.userId === userId ? "text-sola-gold" : "text-white"
                      }`}
                    >
                      {msg.userName}
                    </span>
                    <span className="text-white/30 text-xs">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm break-words">{msg.content}</p>
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Send a message..."
            className="flex-1 bg-white/5 border border-white/10 px-4 py-2 text-white text-sm placeholder:text-white/30 focus:border-sola-gold focus:outline-none"
            maxLength={500}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="px-4 bg-sola-gold text-sola-black disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
