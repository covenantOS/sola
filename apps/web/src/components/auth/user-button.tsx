"use client"

import { LogOut, User } from "lucide-react"
import { useState } from "react"

type Props = {
  user: {
    sub: string
    name?: string
    email?: string
    picture?: string
  }
  onSignOut: () => Promise<void>
}

export function UserButton({ user, onSignOut }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() || "U"

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors"
      >
        <div className="w-8 h-8 bg-sola-gold/20 border border-sola-gold/50 flex items-center justify-center">
          {user.picture ? (
            <img
              src={user.picture}
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
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  onSignOut()
                }}
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
