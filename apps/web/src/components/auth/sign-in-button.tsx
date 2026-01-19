"use client"

type Props = {
  onSignIn: () => Promise<void>
}

export function SignInButton({ onSignIn }: Props) {
  return (
    <button
      onClick={() => onSignIn()}
      className="w-full bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-8 py-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
    >
      Sign In to Dashboard
    </button>
  )
}
