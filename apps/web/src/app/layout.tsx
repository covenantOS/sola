import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sola+ | The Only Platform That's Unapologetically Christian",
  description: "Creator platform for Christian creators, pastors, and ministries. Unite. Create. Proclaim.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-body antialiased">{children}</body>
    </html>
  )
}
