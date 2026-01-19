"use client"

import { Button } from "@/components/ui/button"

type Props = {
  onSignOut: () => Promise<void>
}

export function SignOutButton({ onSignOut }: Props) {
  return (
    <Button
      variant="outline"
      onClick={() => {
        onSignOut()
      }}
    >
      Sign Out
    </Button>
  )
}
