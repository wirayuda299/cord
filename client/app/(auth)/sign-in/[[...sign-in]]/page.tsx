import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In — Cord",
  description: "Sign in to your Cord account and start chatting.",
}

// eslint-disable-next-line @clerk/next/require-auth-protection
export default async function SignInPage() {
  return (
    <SignIn />
  )
}
