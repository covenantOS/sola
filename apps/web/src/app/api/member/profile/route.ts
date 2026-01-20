import { NextRequest, NextResponse } from "next/server"
import { getCurrentMember } from "@/lib/member-auth"
import { db } from "@/lib/db"

export async function PATCH(request: NextRequest) {
  try {
    const member = await getCurrentMember()

    if (!member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, avatar } = await request.json()

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: member.id },
      data: {
        ...(name !== undefined && { name }),
        ...(avatar !== undefined && { avatar }),
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
      },
    })
  } catch (error) {
    console.error("Failed to update profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
