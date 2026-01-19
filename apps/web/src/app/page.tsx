import { getLogtoContext, signIn, signOut } from "@logto/next/server-actions"
import { redirect } from "next/navigation"
import { logtoConfig } from "@/lib/logto"
import { SignInButton } from "@/components/auth/sign-in-button"
import { UserButton } from "@/components/auth/user-button"

export default async function Home() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sola+
          </h1>
          <p className="text-xl text-muted-foreground">
            Creator platform for Christian creators, pastors, and ministries
          </p>
        </div>

        <div className="bg-card border rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Welcome to Sola+</h2>
          <p className="text-muted-foreground mb-6">
            Build your community, share your message, and grow your ministry with Sola+.
          </p>

          <SignInButton
            onSignIn={async () => {
              "use server"
              await signIn(logtoConfig)
            }}
          />
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Community</h3>
            <p className="text-sm text-muted-foreground">
              Build thriving communities with channels, posts, and real-time discussions.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Courses</h3>
            <p className="text-sm text-muted-foreground">
              Create and sell courses with video lessons, progress tracking, and certificates.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Livestreaming</h3>
            <p className="text-sm text-muted-foreground">
              Go live with your audience for worship, teaching, and Q&A sessions.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
