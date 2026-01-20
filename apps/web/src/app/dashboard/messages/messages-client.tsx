"use client"

import { useState, useEffect, useRef } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  MessageSquare,
  Send,
  Plus,
  Search,
  User,
  Loader2,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getMessages,
  sendMessage,
  startConversation,
  getOrganizationMembers,
} from "@/app/actions/messages"

interface Participant {
  id: string
  name: string | null
  avatar: string | null
}

interface Conversation {
  id: string
  type: string
  name: string | null
  avatar: string | null
  participants: Participant[]
  lastMessage: {
    content: string
    createdAt: Date
  } | null
  updatedAt: Date
}

interface Message {
  id: string
  content: string
  author: {
    id: string
    name: string | null
    avatar: string | null
  }
  isOwn: boolean
  createdAt: Date
  isEdited: boolean
}

interface Member {
  id: string
  name: string | null
  avatar: string | null
  email: string
}

interface MessagesClientProps {
  initialConversations: Conversation[]
}

export function MessagesClient({ initialConversations }: MessagesClientProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [initialMessage, setInitialMessage] = useState("")
  const [isStartingChat, setIsStartingChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async (conversationId: string) => {
    setIsLoading(true)
    setSelectedConversation(conversationId)
    const result = await getMessages(conversationId)
    if (!result.error) {
      setMessages(result.messages)
    }
    setIsLoading(false)
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return

    setIsSending(true)
    const result = await sendMessage({
      conversationId: selectedConversation,
      content: newMessage,
    })

    if (!result.error && result.message) {
      setMessages((prev) => [...prev, result.message])
      setNewMessage("")
    }
    setIsSending(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const openNewChat = async () => {
    setShowNewChat(true)
    setSelectedMember(null)
    setInitialMessage("")
    const result = await getOrganizationMembers()
    if (!result.error) {
      setMembers(result.members)
    }
  }

  const selectMemberForChat = (member: Member) => {
    setSelectedMember(member)
  }

  const startNewChat = async () => {
    if (!selectedMember || !initialMessage.trim()) return

    setIsStartingChat(true)
    const result = await startConversation({
      participantId: selectedMember.id,
      initialMessage: initialMessage.trim(),
    })

    if (!result.error && result.conversationId) {
      // Add the new conversation to the list optimistically
      const newConv: Conversation = {
        id: result.conversationId,
        type: "DIRECT",
        name: selectedMember.name,
        avatar: selectedMember.avatar,
        participants: [{
          id: selectedMember.id,
          name: selectedMember.name,
          avatar: selectedMember.avatar,
        }],
        lastMessage: {
          content: initialMessage.trim(),
          createdAt: new Date(),
        },
        updatedAt: new Date(),
      }
      setConversations((prev) => [newConv, ...prev])

      // Load the messages and close the modal
      loadMessages(result.conversationId)
      setShowNewChat(false)
      setSelectedMember(null)
      setInitialMessage("")
    }
    setIsStartingChat(false)
  }

  const goBackToMemberList = () => {
    setSelectedMember(null)
    setInitialMessage("")
  }

  const selectedConv = conversations.find((c) => c.id === selectedConversation)
  const filteredMembers = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-full bg-sola-black border border-white/10">
      {/* Sidebar - Conversations List */}
      <div className="w-80 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-display text-lg text-white uppercase tracking-wide">
            Messages
          </h2>
          <button
            onClick={openNewChat}
            className="w-8 h-8 bg-sola-gold/10 flex items-center justify-center hover:bg-sola-gold/20 transition-colors"
          >
            <Plus className="h-4 w-4 text-sola-gold" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 mb-4">No conversations yet</p>
              <button
                onClick={openNewChat}
                className="inline-flex items-center gap-2 text-sola-gold hover:text-sola-gold/80 transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                Start a conversation
              </button>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadMessages(conv.id)}
                className={cn(
                  "w-full p-4 text-left border-b border-white/5 hover:bg-white/5 transition-colors",
                  selectedConversation === conv.id && "bg-white/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {conv.avatar ? (
                      <img
                        src={conv.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-white/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {conv.name || "Unknown"}
                    </p>
                    {conv.lastMessage && (
                      <p className="text-sm text-white/50 truncate">
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <span className="text-xs text-white/30">
                      {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                        addSuffix: false,
                      })}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 flex items-center justify-center overflow-hidden">
                {selectedConv?.avatar ? (
                  <img
                    src={selectedConv.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-white/40" />
                )}
              </div>
              <div>
                <p className="text-white font-display uppercase tracking-wide">
                  {selectedConv?.name || "Unknown"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 text-sola-gold animate-spin" />
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] p-3",
                          message.isOwn
                            ? "bg-sola-gold text-sola-black"
                            : "bg-white/10 text-white"
                        )}
                      >
                        {!message.isOwn && (
                          <p className="text-xs text-white/60 mb-1">
                            {message.author.name}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={cn(
                            "text-xs mt-1",
                            message.isOwn ? "text-sola-black/60" : "text-white/40"
                          )}
                        >
                          {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || isSending}
                  className="w-12 h-12 bg-sola-gold flex items-center justify-center hover:bg-sola-gold/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <Loader2 className="h-5 w-5 text-sola-black animate-spin" />
                  ) : (
                    <Send className="h-5 w-5 text-sola-black" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 text-lg">
                Select a conversation or start a new one
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-sola-dark-navy border border-white/10 w-full max-w-md">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedMember && (
                  <button
                    onClick={goBackToMemberList}
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    ← Back
                  </button>
                )}
                <h3 className="font-display text-lg text-white uppercase tracking-wide">
                  {selectedMember ? `Message ${selectedMember.name || "Member"}` : "New Conversation"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowNewChat(false)
                  setSelectedMember(null)
                  setInitialMessage("")
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>

            <div className="p-4">
              {/* Step 1: Select Member */}
              {!selectedMember && (
                <>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search members..."
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredMembers.length === 0 ? (
                      <p className="text-center text-white/40 py-4">
                        {members.length === 0
                          ? "No members in your organization yet"
                          : "No members found"}
                      </p>
                    ) : (
                      filteredMembers.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => selectMemberForChat(member)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                        >
                          <div className="w-10 h-10 bg-white/10 flex items-center justify-center overflow-hidden">
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-white/40" />
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-white">{member.name || "Unknown"}</p>
                            <p className="text-sm text-white/50">{member.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}

              {/* Step 2: Write Message */}
              {selectedMember && (
                <div className="space-y-4">
                  {/* Selected member preview */}
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded">
                    <div className="w-10 h-10 bg-white/10 flex items-center justify-center overflow-hidden">
                      {selectedMember.avatar ? (
                        <img
                          src={selectedMember.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-white/40" />
                      )}
                    </div>
                    <div>
                      <p className="text-white">{selectedMember.name || "Unknown"}</p>
                      <p className="text-sm text-white/50">{selectedMember.email}</p>
                    </div>
                  </div>

                  {/* Message input */}
                  <div>
                    <label className="block text-sm text-white/60 mb-2">
                      Write your message
                    </label>
                    <textarea
                      value={initialMessage}
                      onChange={(e) => setInitialMessage(e.target.value)}
                      placeholder="Type your message..."
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors resize-none"
                      autoFocus
                    />
                  </div>

                  {/* Send button */}
                  <button
                    onClick={startNewChat}
                    disabled={!initialMessage.trim() || isStartingChat}
                    className="w-full bg-sola-gold text-sola-black font-display uppercase tracking-wide py-3 flex items-center justify-center gap-2 hover:bg-sola-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStartingChat ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
