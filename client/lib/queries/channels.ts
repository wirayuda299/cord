import "server-only"

import { getPublicApiUrl } from "@/lib/env"
import type { Channel } from "@/types/channel"
import { Category } from "@/types/category"
import { auth } from "@clerk/nextjs/server"


type CategoryWithChannels = Category & {
  channels: Channel[]
}

export type GroupedChannels = {
  server: {
    id: string
    name: string
    logo?: string
    created_by: string
  }
  uncategorized: Channel[]
  categories: CategoryWithChannels[]
}
export async function getAllChannel(serverID: string): Promise<GroupedChannels | null> {
  const { getToken, userId } = await auth()
  try {
    if (!userId) {
      throw new Error("unauthenticated")
    }
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/channel/find-all?serverID=${serverID}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      next: { tags: ["channels", "servers"] }
    })
    return await res.json().then((d) => d.data)
  } catch (e) {
    // Callers must treat this as "couldn't load" and render their own
    // fallback — previously this returned `[]` mis-cast as GroupedChannels,
    // so `channels.server` silently became `undefined` instead of the
    // failure being visible, which crashed callers with no null-check
    // (e.g. ServerSidebar) instead of falling back gracefully.
    return null
  }
}
