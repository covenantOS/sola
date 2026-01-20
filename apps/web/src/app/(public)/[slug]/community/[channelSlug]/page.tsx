import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ slug: string; channelSlug: string }>
}

// Redirect to main community page with channel query param
export default async function ChannelPage({ params }: PageProps) {
  const { slug, channelSlug } = await params
  redirect(`/${slug}/community?channel=${channelSlug}`)
}
