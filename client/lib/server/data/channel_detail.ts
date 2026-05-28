import { getPublicApiUrl } from "@/lib/env"
import { Channel } from "@/lib/types/channel"
import { cache } from "react"

export const getChannelById = cache(async (id: string) => {
  const base = getPublicApiUrl()
  const res = await fetch(`${base}/channel?channelId=${id}`, {
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
})
