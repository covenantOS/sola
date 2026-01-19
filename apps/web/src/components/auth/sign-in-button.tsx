"use client"

import { Button } from "@/components/ui/button"

type Props = {
  onSignIn: () => Promise<void>
}

export function SignInButton({ onSignIn }: Props) {
  return (
    <Button
      onClick={() => {
        onSignIn()
      }}
    >
      Sign In
    </Button>
  )
}
