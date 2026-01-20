import { getConversations } from "@/app/actions/messages"
import { MessagesClient } from "./messages-client"

export const dynamic = "force-dynamic"

export default async function MessagesPage() {
  const { conversations, error } = await getConversations()

  return (
    <div className="h-[calc(100vh-8rem)]">
      <MessagesClient initialConversations={conversations || []} />
    </div>
  )
}
