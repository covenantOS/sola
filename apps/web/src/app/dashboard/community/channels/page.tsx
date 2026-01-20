export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"

// Redirect to main community page which has channel management
export default function ChannelsPage() {
  redirect("/dashboard/community")
}
