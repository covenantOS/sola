import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const results: Record<string, unknown> = {}

  // Check env vars (without exposing full values)
  const dbUrl = process.env.DATABASE_URL || ""
  const directUrl = process.env.DIRECT_URL || ""

  results.DATABASE_URL_set = !!dbUrl
  results.DATABASE_URL_length = dbUrl.length
  results.DATABASE_URL_starts_with_postgresql = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")
  results.DATABASE_URL_first_30_chars = dbUrl.substring(0, 30) + "..."

  results.DIRECT_URL_set = !!directUrl
  results.DIRECT_URL_length = directUrl.length

  // Try to connect to database
  try {
    const userCount = await db.user.count()
    results.db_connection = "SUCCESS"
    results.user_count = userCount
  } catch (error) {
    results.db_connection = "FAILED"
    results.db_error = error instanceof Error ? error.message : String(error)
  }

  return NextResponse.json(results)
}
