import { NextResponse } from "next/server"
import {
  getSessionCookie,
  deleteSession,
  clearSessionCookie,
} from "@/lib/member-auth"

export async function POST() {
  try {
    const token = await getSessionCookie()

    if (token) {
      await deleteSession(token)
    }

    await clearSessionCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    // Clear cookie even if there's an error
    await clearSessionCookie()
    return NextResponse.json({ success: true })
  }
}
