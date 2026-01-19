import { getLogtoContext, signIn } from "@logto/next/server-actions"
import { redirect } from "next/navigation"
import { logtoConfig } from "@/lib/logto"
import { SignInButton } from "@/components/auth/sign-in-button"
import { Users, BookOpen, Video, Church, Shield, Zap } from "lucide-react"
import Image from "next/image"

export default async function Home() {
  const { isAuthenticated } = await getLogtoContext(logtoConfig)

  if (isAuthenticated) {
    redirect("/dashboard")
  }

  return (
    <main className="min-h-screen bg-sola-black">
      {/* Red accent line at top */}
      <div className="h-1 bg-sola-red w-full" />

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-6 py-24 md:py-32">
        <div className="text-center max-w-4xl">
          {/* Logo */}
          <div className="mb-6">
            <Image
              src="/logo-dark.svg"
              alt="Sola+"
              width={320}
              height={64}
              className="h-16 md:h-20 w-auto mx-auto"
              priority
            />
          </div>

          {/* Tagline */}
          <p className="font-display text-xl md:text-2xl text-sola-gold uppercase tracking-widest mb-4">
            Unite. Create. Proclaim.
          </p>

          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-12">
            The only platform that&apos;s unapologetically Christian. Built for creators, pastors, and ministries who refuse to compromise.
          </p>

          {/* CTA Card */}
          <div className="bg-white/5 border border-white/10 p-8 md:p-12 max-w-lg mx-auto">
            <h2 className="font-display text-2xl md:text-3xl text-white uppercase tracking-tight mb-4">
              Creator Dashboard
            </h2>
            <p className="text-white/60 mb-8">
              Access your community, courses, and analytics. Build your ministry without compromise.
            </p>

            <SignInButton
              onSignIn={async () => {
                "use server"
                await signIn(logtoConfig)
              }}
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 py-24 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl text-white uppercase tracking-tight text-center mb-4">
            Everything You Need
          </h2>
          <p className="text-white/60 text-center mb-16 max-w-2xl mx-auto">
            One platform. No compromises. Full ownership of your content and community.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Community */}
            <div className="bg-white/5 border border-white/10 p-8 hover:border-sola-gold/50 transition-all duration-300">
              <div className="w-14 h-14 bg-sola-gold/10 flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-sola-gold" />
              </div>
              <h3 className="font-display text-xl text-white uppercase tracking-wide mb-3">
                Community
              </h3>
              <p className="text-white/60">
                Build thriving communities with channels, posts, and real-time discussions. No censorship. No algorithms.
              </p>
            </div>

            {/* Courses */}
            <div className="bg-white/5 border border-white/10 p-8 hover:border-sola-gold/50 transition-all duration-300">
              <div className="w-14 h-14 bg-sola-gold/10 flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-sola-gold" />
              </div>
              <h3 className="font-display text-xl text-white uppercase tracking-wide mb-3">
                Courses
              </h3>
              <p className="text-white/60">
                Create and sell courses with video lessons, progress tracking, and certificates. Your content, your terms.
              </p>
            </div>

            {/* Livestreaming */}
            <div className="bg-white/5 border border-white/10 p-8 hover:border-sola-gold/50 transition-all duration-300">
              <div className="w-14 h-14 bg-sola-gold/10 flex items-center justify-center mb-6">
                <Video className="w-7 h-7 text-sola-gold" />
              </div>
              <h3 className="font-display text-xl text-white uppercase tracking-wide mb-3">
                Livestreaming
              </h3>
              <p className="text-white/60">
                Go live with your audience for worship, teaching, and Q&A sessions. Professional quality, instant recording.
              </p>
            </div>

            {/* Ministry Tools */}
            <div className="bg-white/5 border border-white/10 p-8 hover:border-sola-gold/50 transition-all duration-300">
              <div className="w-14 h-14 bg-sola-gold/10 flex items-center justify-center mb-6">
                <Church className="w-7 h-7 text-sola-gold" />
              </div>
              <h3 className="font-display text-xl text-white uppercase tracking-wide mb-3">
                Ministry Tools
              </h3>
              <p className="text-white/60">
                Designed specifically for Christian ministry. Prayer requests, devotionals, and sermon archives.
              </p>
            </div>

            {/* Payments */}
            <div className="bg-white/5 border border-white/10 p-8 hover:border-sola-gold/50 transition-all duration-300">
              <div className="w-14 h-14 bg-sola-gold/10 flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-sola-gold" />
              </div>
              <h3 className="font-display text-xl text-white uppercase tracking-wide mb-3">
                Direct Payments
              </h3>
              <p className="text-white/60">
                Money goes straight to your bank. No platform fees eating your support. Just Stripe&apos;s standard rate.
              </p>
            </div>

            {/* Ownership */}
            <div className="bg-white/5 border border-white/10 p-8 hover:border-sola-gold/50 transition-all duration-300">
              <div className="w-14 h-14 bg-sola-gold/10 flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-sola-gold" />
              </div>
              <h3 className="font-display text-xl text-white uppercase tracking-wide mb-3">
                Full Ownership
              </h3>
              <p className="text-white/60">
                Your content. Your community. Your data. Export everything anytime. We work for you, not the other way around.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Image
            src="/logo-dark.svg"
            alt="Sola+"
            width={120}
            height={24}
            className="h-8 w-auto"
          />
          <p className="text-white/40 text-sm">
            The only platform that&apos;s unapologetically Christian.
          </p>
        </div>
      </footer>
    </main>
  )
}
