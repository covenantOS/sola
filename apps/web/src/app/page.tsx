export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Sola+ Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          Creator platform for Christian creators, pastors, and ministries
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/api/auth/sign-in"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Sign In
          </a>
          <a
            href="/api/auth/sign-up"
            className="px-6 py-3 border border-input rounded-lg hover:bg-accent"
          >
            Sign Up
          </a>
        </div>
      </div>
    </main>
  )
}
