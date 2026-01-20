import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Reserved subdomains that cannot be used
const RESERVED_SUBDOMAINS = [
  "www",
  "app",
  "api",
  "my",
  "admin",
  "dashboard",
  "auth",
  "login",
  "signup",
  "register",
  "help",
  "support",
  "docs",
  "blog",
  "mail",
  "email",
  "ftp",
  "cdn",
  "static",
  "assets",
  "media",
  "images",
  "files",
  "uploads",
  "download",
  "downloads",
  "test",
  "dev",
  "staging",
  "demo",
  "beta",
  "alpha",
  "store",
  "shop",
  "checkout",
  "payment",
  "payments",
  "billing",
  "account",
  "accounts",
  "settings",
  "profile",
  "user",
  "users",
  "member",
  "members",
  "community",
  "communities",
  "course",
  "courses",
  "stream",
  "live",
  "video",
  "videos",
  "webhook",
  "webhooks",
  "status",
  "health",
  "ping",
  "null",
  "undefined",
  "sola",
  "solaplus",
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const subdomain = searchParams.get("subdomain")

  if (!subdomain) {
    return NextResponse.json({ error: "Subdomain is required" }, { status: 400 })
  }

  // Validate format
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
  if (!subdomainRegex.test(subdomain) || subdomain.length < 3 || subdomain.length > 50) {
    return NextResponse.json({
      available: false,
      error: "Invalid subdomain format. Use 3-50 lowercase letters, numbers, and hyphens.",
    })
  }

  // Check reserved
  if (RESERVED_SUBDOMAINS.includes(subdomain)) {
    return NextResponse.json({
      available: false,
      error: "This subdomain is reserved.",
    })
  }

  // Check if already taken
  const existing = await db.organization.findUnique({
    where: { slug: subdomain },
    select: { id: true },
  })

  if (existing) {
    return NextResponse.json({
      available: false,
      error: "This subdomain is already taken.",
    })
  }

  return NextResponse.json({
    available: true,
    subdomain,
    url: `${subdomain}.solaplus.ai`,
  })
}
