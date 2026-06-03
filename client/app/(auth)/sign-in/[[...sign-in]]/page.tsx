import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In — Cord",
  description: "Sign in to your Cord account and start chatting.",
}

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        variables: {
          colorPrimary: "#5865f2",
          colorBackground: "transparent",
          colorText: "#f2f3f5",
          colorTextSecondary: "#949ba4",
          colorInputBackground: "rgba(255,255,255,0.05)",
          colorInputText: "#f2f3f5",
          borderRadius: "10px",
          fontFamily: "var(--font-noto-sans, sans-serif)",
        },
        elements: {
          card: "auth-clerk-card",
          rootBox: "auth-clerk-root",
        },
      }}
    />
  )
}
