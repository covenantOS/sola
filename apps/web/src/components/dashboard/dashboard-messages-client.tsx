"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Send } from "lucide-react"
import { sendMessage } from "@/app/actions/messages"

interface Props {
  conversationId: string
}

export function DashboardMessagesClient({ conversationId }: Props) {
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSend = () => {
    if (!message.trim()) return

    startTransition(async () => {
      const result = await sendMessage(conversationId, message)
      if (result.success) {
        setMessage("")
        router.refresh()
      }
    })
  }

  return (
    <div className="p-4 border-t border-white/10">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={isPending || !message.trim()}
          className="bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
