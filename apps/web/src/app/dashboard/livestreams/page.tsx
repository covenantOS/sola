import { getLivestreams } from "@/app/actions/livestreams"
import { LivestreamsClient } from "./livestreams-client"

export const dynamic = "force-dynamic"

export default async function LivestreamsPage() {
  const { livestreams, error } = await getLivestreams()

  return <LivestreamsClient initialLivestreams={livestreams || []} />
}
