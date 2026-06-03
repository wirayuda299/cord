import { getPublicApiUrl } from "@/lib/env"

type User = {
  id: string
  username: string
  avatar_url: string
  avatar_id: string
  bio: string
  email_verified: string
}

export async function createUser(u: User) {
  try {

    const res = await fetch(`${getPublicApiUrl()}/users/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(u)
    })

    if (!res.ok) {
      throw new Error("failed to create user")
    }
  } catch (e) {
    throw e
  }

}
