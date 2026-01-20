/**
 * Vercel API Integration
 *
 * Automates custom domain management for creator sites.
 * When a creator adds a custom domain, we automatically:
 * 1. Add the domain to the Vercel project
 * 2. Return DNS instructions for the creator
 * 3. Vercel handles SSL provisioning automatically
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID // Optional, for team projects

interface VercelDomainResponse {
  name: string
  apexName: string
  projectId: string
  verified: boolean
  verification?: {
    type: string
    domain: string
    value: string
    reason: string
  }[]
  error?: {
    code: string
    message: string
  }
}

interface DomainConfig {
  configuredBy: "CNAME" | "A" | "http" | null
  acceptedChallenges: string[]
  misconfigured: boolean
}

interface AddDomainResult {
  success: boolean
  domain?: string
  verified?: boolean
  dnsInstructions?: {
    type: "A" | "CNAME"
    name: string
    value: string
  }
  error?: string
}

interface DomainStatusResult {
  exists: boolean
  verified: boolean
  configured: boolean
  misconfigured: boolean
  dnsInstructions?: {
    type: "A" | "CNAME"
    name: string
    value: string
  }
  error?: string
}

/**
 * Add a custom domain to the Vercel project
 */
export async function addDomainToVercel(domain: string): Promise<AddDomainResult> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return {
      success: false,
      error: "Vercel API credentials not configured. Please set VERCEL_TOKEN and VERCEL_PROJECT_ID.",
    }
  }

  try {
    const url = new URL(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`)
    if (VERCEL_TEAM_ID) {
      url.searchParams.set("teamId", VERCEL_TEAM_ID)
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    })

    const data = await response.json() as VercelDomainResponse

    if (!response.ok) {
      // Handle specific error cases
      if (data.error?.code === "domain_already_in_use") {
        return {
          success: false,
          error: "This domain is already in use by another Vercel project.",
        }
      }
      if (data.error?.code === "forbidden") {
        return {
          success: false,
          error: "Domain ownership verification required. Please verify you own this domain.",
        }
      }
      return {
        success: false,
        error: data.error?.message || "Failed to add domain to Vercel.",
      }
    }

    // Determine DNS instructions based on domain type
    const isApexDomain = !domain.includes(".") || domain.split(".").length === 2
    const dnsInstructions = isApexDomain
      ? {
          type: "A" as const,
          name: "@",
          value: "76.76.21.21",
        }
      : {
          type: "CNAME" as const,
          name: domain.split(".")[0],
          value: "cname.vercel-dns.com",
        }

    return {
      success: true,
      domain: data.name,
      verified: data.verified,
      dnsInstructions,
    }
  } catch (error) {
    console.error("Error adding domain to Vercel:", error)
    return {
      success: false,
      error: "Network error while adding domain. Please try again.",
    }
  }
}

/**
 * Remove a custom domain from the Vercel project
 */
export async function removeDomainFromVercel(domain: string): Promise<{ success: boolean; error?: string }> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return {
      success: false,
      error: "Vercel API credentials not configured.",
    }
  }

  try {
    const url = new URL(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`)
    if (VERCEL_TEAM_ID) {
      url.searchParams.set("teamId", VERCEL_TEAM_ID)
    }

    const response = await fetch(url.toString(), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    })

    if (!response.ok && response.status !== 404) {
      const data = await response.json()
      return {
        success: false,
        error: data.error?.message || "Failed to remove domain from Vercel.",
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error removing domain from Vercel:", error)
    return {
      success: false,
      error: "Network error while removing domain.",
    }
  }
}

/**
 * Check the configuration status of a domain
 */
export async function checkDomainStatus(domain: string): Promise<DomainStatusResult> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return {
      exists: false,
      verified: false,
      configured: false,
      misconfigured: false,
      error: "Vercel API credentials not configured.",
    }
  }

  try {
    // Check if domain exists in project
    const domainUrl = new URL(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`)
    if (VERCEL_TEAM_ID) {
      domainUrl.searchParams.set("teamId", VERCEL_TEAM_ID)
    }

    const domainResponse = await fetch(domainUrl.toString(), {
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    })

    if (domainResponse.status === 404) {
      return {
        exists: false,
        verified: false,
        configured: false,
        misconfigured: false,
      }
    }

    const domainData = await domainResponse.json() as VercelDomainResponse

    // Check domain configuration
    const configUrl = new URL(`https://api.vercel.com/v6/domains/${domain}/config`)
    if (VERCEL_TEAM_ID) {
      configUrl.searchParams.set("teamId", VERCEL_TEAM_ID)
    }

    const configResponse = await fetch(configUrl.toString(), {
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    })

    const configData = await configResponse.json() as DomainConfig

    // Determine DNS instructions
    const isApexDomain = !domain.includes(".") || domain.split(".").length === 2
    const dnsInstructions = isApexDomain
      ? {
          type: "A" as const,
          name: "@",
          value: "76.76.21.21",
        }
      : {
          type: "CNAME" as const,
          name: domain.split(".")[0],
          value: "cname.vercel-dns.com",
        }

    return {
      exists: true,
      verified: domainData.verified,
      configured: configData.configuredBy !== null,
      misconfigured: configData.misconfigured,
      dnsInstructions,
    }
  } catch (error) {
    console.error("Error checking domain status:", error)
    return {
      exists: false,
      verified: false,
      configured: false,
      misconfigured: false,
      error: "Network error while checking domain status.",
    }
  }
}

/**
 * Verify a domain (triggers Vercel to check DNS)
 */
export async function verifyDomain(domain: string): Promise<{ success: boolean; verified: boolean; error?: string }> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return {
      success: false,
      verified: false,
      error: "Vercel API credentials not configured.",
    }
  }

  try {
    const url = new URL(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}/verify`)
    if (VERCEL_TEAM_ID) {
      url.searchParams.set("teamId", VERCEL_TEAM_ID)
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    })

    const data = await response.json() as VercelDomainResponse

    if (!response.ok) {
      return {
        success: false,
        verified: false,
        error: data.error?.message || "Failed to verify domain.",
      }
    }

    return {
      success: true,
      verified: data.verified,
    }
  } catch (error) {
    console.error("Error verifying domain:", error)
    return {
      success: false,
      verified: false,
      error: "Network error while verifying domain.",
    }
  }
}
