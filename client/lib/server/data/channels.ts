import "server-only"

import { getPublicApiUrl } from "@/lib/env"
import type { Channel } from "@/lib/types/channel"
import { Category } from "@/lib/types/category"

export async function getChannelById(channelId: string) {
  const base = getPublicApiUrl()
  const res = await fetch(`${base}/channel?channelId=${channelId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
  if (!res.ok) {
    return { error: "Failed to fetch channel" }
  }
  const { data } = await res.json()
  return data as Channel
}

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
  try {
    const base = getPublicApiUrl()
    const res = await fetch(`${base}/channel/find-all?serverID=${serverID}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      next: { tags: ["channels"] }
    })
    return await res.json().then((d) => d.data)
  } catch (e) {
    throw e
  }
}
