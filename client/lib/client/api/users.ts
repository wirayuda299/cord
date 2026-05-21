import { getPublicApiUrl } from "@/lib/env"
import { User } from "@/lib/types/user"

export type Friend = User & { friend_status: string }

export async function findUsersByName(username: string) {

  try {

    if (!username) {
      throw new Error("Username is required")
    }

    const res = await fetch(`${getPublicApiUrl()}/users/find-by-name?username=${username}`)

    if (!res.ok) {
      throw Error("Failed to fetch users")
    }

    const users = await res.json()
    return users.data as Friend[]
  } catch (e) {

    throw e
  }
}
