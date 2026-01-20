import { getOrganizationBySlug } from "@/lib/organization"
import { getLogtoContext, signIn } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { LogIn } from "lucide-react"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function LoginPage({ params }: PageProps) {
  const { slug } = await params
  const organization = await getOrganizationBySlug(slug)

  if (!organization) {
    notFound()
  }

  // Check if already authenticated
  const { isAuthenticated } = await getLogtoContext(logtoConfig)

  if (isAuthenticated) {
    redirect(`/${slug}`)
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl text-white uppercase tracking-tight">
          Sign In
        </h1>
        <p className="text-white/60 mt-2">
          Welcome back to {organization.name}
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 p-8">
        <form
          action={async () => {
            "use server"
            await signIn(logtoConfig, `/${slug}`)
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-4 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
          >
            <LogIn className="h-5 w-5" />
            Sign In with Logto
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/50 text-sm">
            Don&apos;t have an account?{" "}
            <Link href={`/${slug}/join`} className="text-sola-gold hover:underline">
              Join now
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
