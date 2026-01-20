import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Subdomain Routing Middleware
 *
 * This handles routing for:
 * 1. Main app: my.solaplus.ai (no subdomain)
 * 2. Creator sites: {slug}.my.solaplus.ai
 * 3. Custom domains: community.yourdomain.com
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

// The base domain (without subdomain)
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_SUBDOMAIN_BASE || "my.solaplus.ai"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get("host") || ""
  const pathname = url.pathname

  // Skip middleware for protected paths
  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Get subdomain by removing the root domain
  // e.g., "creator.my.solaplus.ai" -> "creator"
  // e.g., "my.solaplus.ai" -> "" (root)
  let subdomain = ""
  let isCustomDomain = false

  if (hostname.endsWith(ROOT_DOMAIN)) {
    // This is a subdomain of our main domain
    const parts = hostname.replace(`.${ROOT_DOMAIN}`, "").split(".")
    subdomain = parts[0] === ROOT_DOMAIN.split(".")[0] ? "" : parts[0]
  } else if (!hostname.includes("localhost")) {
    // This is a custom domain
    isCustomDomain = true
    subdomain = hostname // We'll look up the org by custom domain
  }

  // If no subdomain and not custom domain, this is the main app
  if (!subdomain && !isCustomDomain) {
    return NextResponse.next()
  }

  // For subdomains/custom domains, rewrite to the organization-specific pages
  // Store the subdomain/domain info in headers for server components to access
  const response = NextResponse.rewrite(
    new URL(`/org${pathname === "/" ? "" : pathname}`, request.url)
  )

  // Pass subdomain info to the app
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
