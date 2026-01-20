"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Mail, Shield, Crown, User, Ban, Trash2 } from "lucide-react"
import { updateMemberRole, removeMember } from "@/app/actions/members"

interface Props {
  memberId: string
  currentRole: string
  userEmail: string
}

export function MemberActions({ memberId, currentRole, userEmail }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleRoleChange = (newRole: string) => {
    startTransition(async () => {
      const result = await updateMemberRole(memberId, newRole)
      if (result.success) {
        router.refresh()
      }
      setIsOpen(false)
    })
  }

  const handleRemove = () => {
    if (!confirm(`Are you sure you want to remove this member?`)) return

    startTransition(async () => {
      const result = await removeMember(memberId)
      if (result.success) {
        router.refresh()
      }
      setIsOpen(false)
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-white/40 hover:text-white transition-colors"
        disabled={isPending}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-48 bg-sola-dark-navy border border-white/10 z-50">
            <div className="p-1">
              <button
                onClick={() => window.location.href = `mailto:${userEmail}`}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Send Email
              </button>

              <div className="my-1 border-t border-white/10" />

              <p className="px-3 py-1 text-xs text-white/40 uppercase tracking-wide">
                Change Role
              </p>

              {currentRole !== "ADMIN" && (
                <button
                  onClick={() => handleRoleChange("ADMIN")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Shield className="h-4 w-4 text-sola-red" />
                  Make Admin
                </button>
              )}

              {currentRole !== "MODERATOR" && (
                <button
                  onClick={() => handleRoleChange("MODERATOR")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Shield className="h-4 w-4 text-blue-400" />
                  Make Moderator
                </button>
              )}

              {currentRole !== "MEMBER" && currentRole !== "OWNER" && (
                <button
                  onClick={() => handleRoleChange("MEMBER")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <User className="h-4 w-4" />
                  Make Member
                </button>
              )}

              <div className="my-1 border-t border-white/10" />

              {currentRole !== "OWNER" && (
                <button
                  onClick={handleRemove}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sola-red hover:bg-sola-red/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Member
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
