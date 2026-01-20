"use client"

import { NavLink } from "@/components/nav-link"
import {
  Home,
  Users,
  BookOpen,
  Video,
  CreditCard,
  Settings,
  BarChart3,
  MessageSquare,
  Crown,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home, exact: true },
  { name: "Community", href: "/dashboard/community", icon: Users },
  { name: "Members", href: "/dashboard/members", icon: Crown },
  { name: "Courses", href: "/dashboard/courses", icon: BookOpen },
  { name: "Livestreams", href: "/dashboard/livestreams", icon: Video },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function SidebarNav() {
  return (
    <nav className="flex flex-col gap-1 p-4" data-tour="sidebar-nav">
      {navigation.map((item) => (
        <NavLink key={item.name} href={item.href} icon={item.icon} exact={item.exact}>
          {item.name}
        </NavLink>
      ))}
    </nav>
  )
}
