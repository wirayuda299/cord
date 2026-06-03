import "client-only"

import { getPublicApiUrl } from "@/lib/env"
import type { Channel } from "@/lib/types/channel"
import { getToken } from "@clerk/nextjs"

export async function getAllChannelByCategoryId(
  categoryID: string
): Promise<Channel[] | { error: string }> {
  try {
    const base = getPublicApiUrl()
    const token = await getToken()
    const response = await fetch(`${base}/channel/find-all?categoryID=${categoryID}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
    })
    if (!response.ok) {
      return { error: "Failed to get all channels" }
    }
    const { data } = await response.json()
    return data as Channel[]
  } catch (e) {
    return { error: String(e) }
  }
}
