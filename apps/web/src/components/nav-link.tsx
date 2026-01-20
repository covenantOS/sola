"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface NavLinkProps {
  href: string
  icon: LucideIcon
  children: React.ReactNode
  exact?: boolean
}

export function NavLink({ href, icon: Icon, children, exact = false }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        "nav-link group relative flex items-center gap-3 px-3 py-2.5 border-l-2 transition-all duration-200",
        isActive
          ? "text-white bg-white/5 border-l-[var(--brand-color,#D4A84B)]"
          : "text-white/60 border-transparent hover:text-white hover:bg-white/5 hover:border-l-[var(--brand-color,#D4A84B)]"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
          isActive && "text-[var(--brand-color,#D4A84B)]"
        )}
      />
      <span className="font-display text-sm uppercase tracking-wide">{children}</span>
      {isActive && (
        <span
          className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full"
          style={{ backgroundColor: "var(--brand-color, #D4A84B)" }}
        />
      )}
    </Link>
  )
}
