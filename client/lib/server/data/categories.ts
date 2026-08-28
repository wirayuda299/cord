import "server-only"

import { getPublicApiUrl } from "@/lib/env"
import type { Category } from "@/lib/types/category"
import { auth } from "@clerk/nextjs/server"

export async function getAllCategories(serverID: string) {
  const { getToken, userId } = await auth()
  try {
    if (!userId) {
      return { error: "unauthenticated" }
    }
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/categories?serverID=${serverID}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },

      next: {
        tags: ["categories"],
      },
    })

    const data = await res.json()
    if (!res.ok) {
      return { error: data.message }
    }
    return data.data as Category[]
  } catch (e) {
    return { error: e }
  }
}
