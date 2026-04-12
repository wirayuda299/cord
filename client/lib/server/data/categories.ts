import "server-only"

import { getPublicApiUrl } from "@/lib/env"
import type { Category } from "@/lib/types/category"

export async function getAllCategories(serverID: string) {
  try {
    const base = getPublicApiUrl()
    const res = await fetch(`${base}/categories?serverID=${serverID}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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
