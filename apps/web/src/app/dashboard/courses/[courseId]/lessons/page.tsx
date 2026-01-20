import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ courseId: string }>
}

// Redirect to course editor which has lesson management
export default async function LessonsPage({ params }: PageProps) {
  const { courseId } = await params
  redirect(`/dashboard/courses/${courseId}`)
}
