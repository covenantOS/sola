import Link from "next/link"

export default function OrgNotFound() {
  return (
    <div className="min-h-screen bg-sola-black flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="font-display text-6xl text-white mb-4">404</h1>
        <h2 className="font-display text-2xl text-white uppercase tracking-wide mb-4">
          Community Not Found
        </h2>
        <p className="text-white/60 mb-8">
          The community you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <Link
          href="https://solaplus.ai"
          className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm"
        >
          Go to Sola+
        </Link>
      </div>
    </div>
  )
}
