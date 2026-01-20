import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Subdomain Routing Middleware
 *
 * Domain Structure:
 * ─────────────────────────────────────────────────────────────
 * solaplus.ai              → Marketing (hosted elsewhere)
 * app.solaplus.ai          → Creator dashboard (this app's main)
 * {slug}.solaplus.ai       → Creator's member-facing site
 * theirdomain.com          → Creator's custom domain
 * sub.theirdomain.com      → Creator's custom subdomain
 * ─────────────────────────────────────────────────────────────
 */

// Routes that should never be rewritten (API, static, etc.)
const PROTECTED_PATHS = [
  "/api",
  "/_next",
  "/static",
  "/favicon.ico",
  "/logo",
  "/robots.txt",
  "/sitemap.xml",
]

// Root domain (solaplus.ai)
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "solaplus.ai"

// App subdomain (app.solaplus.ai) - where creators log in and manage
const APP_SUBDOMAIN = process.env.NEXT_PUBLIC_APP_SUBDOMAIN || "app"

// Reserved subdomains that shouldn't be used for organizations
const RESERVED_SUBDOMAINS = [
  "app",      // Creator dashboard
  "www",      // Redirect to root
  "api",      // API endpoints
  "admin",    // Admin panel (future)
  "help",     // Help center (future)
  "docs",     // Documentation (future)
  "blog",     // Blog (future)
  "status",   // Status page (future)
]

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get("host") || ""
  const pathname = url.pathname

  // Skip middleware for protected paths
  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Handle localhost for development
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    // In development, use query param ?org=slug to simulate subdomain
    const orgSlug = url.searchParams.get("org")
    if (orgSlug) {
      const response = NextResponse.rewrite(
        new URL(`/org${pathname === "/" ? "" : pathname}`, request.url)
      )
      response.headers.set("x-subdomain", orgSlug)
      response.headers.set("x-custom-domain", "")
      response.headers.set("x-original-host", hostname)
      return response
    }
    return NextResponse.next()
  }

  let subdomain = ""
  let isCustomDomain = false

  // Check if this is our domain (solaplus.ai or *.solaplus.ai)
  if (hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    // Extract subdomain: "grace-church.solaplus.ai" → "grace-church"
    if (hostname === ROOT_DOMAIN) {
      // Root domain (solaplus.ai) - this should redirect to marketing
      // or be handled by a different deployment
      return NextResponse.next()
    }

    // Get the subdomain part
    subdomain = hostname.replace(`.${ROOT_DOMAIN}`, "")

    // Check if it's the app subdomain (app.solaplus.ai)
    if (subdomain === APP_SUBDOMAIN) {
      // This is the creator dashboard - don't rewrite
      return NextResponse.next()
    }

    // Check if it's a reserved subdomain
    if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
      return NextResponse.next()
    }

    // It's a creator subdomain (e.g., grace-church.solaplus.ai)
  } else {
    // This is a custom domain (e.g., theirdomain.com or courses.theirdomain.com)
    isCustomDomain = true
  }

  // For subdomains/custom domains, rewrite to the organization-specific pages
  const response = NextResponse.rewrite(
    new URL(`/org${pathname === "/" ? "" : pathname}`, request.url)
  )

  // Pass domain info to the app via headers
  response.headers.set("x-subdomain", subdomain)
  response.headers.set("x-custom-domain", isCustomDomain ? hostname : "")
  response.headers.set("x-original-host", hostname)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
