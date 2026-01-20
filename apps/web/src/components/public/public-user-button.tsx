"use client"

import { LogOut, User, Settings, LayoutDashboard } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { signOut } from "@logto/next/client"

type Props = {
  user: {
    name?: string
    email: string
    avatar?: string
  }
  isOwner: boolean
  slug: string
}

export function PublicUserButton({ user, isOwner, slug }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() || "U"

  const handleSignOut = async () => {
    setIsOpen(false)
    window.location.href = "/api/auth/sign-out"
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors"
      >
        <div className="w-8 h-8 bg-sola-gold/20 border border-sola-gold/50 flex items-center justify-center">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-display text-sm text-sola-gold">{initials}</span>
          )}
        </div>
        <span className="text-sm text-white/80 hidden md:block">
          {user.name || user.email || "User"}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-sola-dark-navy border border-white/10 z-50">
            <div className="p-4 border-b border-white/10">
              <p className="text-sm text-white font-medium">{user.name || "User"}</p>
              <p className="text-xs text-white/50">{user.email}</p>
            </div>
            <div className="p-2">
              {isOwner && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-sola-gold hover:bg-sola-gold/10 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Creator Dashboard</span>
                </Link>
              )}
              <Link
                href={`/${slug}/settings`}
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Account Settings</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-sola-red hover:bg-sola-red/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
