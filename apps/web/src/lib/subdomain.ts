import { headers } from "next/headers"
import { db } from "./db"

/**
 * Get subdomain info from the current request
 */
export async function getSubdomainInfo() {
  const headersList = await headers()
  const subdomain = headersList.get("x-subdomain") || ""
  const customDomain = headersList.get("x-custom-domain") || ""
  const originalHost = headersList.get("x-original-host") || ""

  return {
    subdomain,
    customDomain,
    originalHost,
    isSubdomain: !!subdomain,
    isCustomDomain: !!customDomain,
  }
}

/**
 * Get organization by subdomain or custom domain
 */
export async function getOrganizationByDomain() {
  const { subdomain, customDomain, isCustomDomain } = await getSubdomainInfo()

  if (!subdomain && !isCustomDomain) {
    return null
  }

  // Look up by custom domain first via Domain model
  if (isCustomDomain && customDomain) {
    const domain = await db.domain.findFirst({
      where: {
        domain: customDomain,
        status: "VERIFIED",
      },
      include: {
        organization: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    })
    return domain?.organization || null
  }

  // Look up by slug (subdomain)
  if (subdomain) {
    const org = await db.organization.findFirst({
      where: { slug: subdomain },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })
    return org
  }

  return null
}

/**
 * Build the full URL for an organization
 */
export function getOrganizationUrl(slug: string, customDomain?: string | null) {
  const baseUrl = process.env.NEXT_PUBLIC_SUBDOMAIN_BASE || "my.solaplus.ai"
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"

  if (customDomain) {
    return `${protocol}://${customDomain}`
  }

  return `${protocol}://${slug}.${baseUrl}`
}
