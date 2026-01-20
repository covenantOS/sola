import { getAnalytics } from "@/app/actions/analytics"
import { AnalyticsClient } from "./analytics-client"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const data = await getAnalytics()

  if (data.error) {
    return (
      <div className="p-6 text-center">
        <p className="text-white/60">{data.error}</p>
      </div>
    )
  }

  return (
    <AnalyticsClient
      overview={data.overview!}
      recentActivity={data.recentActivity!}
    />
  )
}
