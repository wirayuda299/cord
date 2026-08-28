import "server-only"

import { getPublicApiUrl } from "@/lib/env"
import type { Channel } from "@/lib/types/channel"
import { Category } from "@/lib/types/category"
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
export async function getAllChannel(serverID: string): Promise<GroupedChannels> {
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
    return [] as unknown as Promise<GroupedChannels>
  }
}
