import { getPublicApiUrl } from "@/lib/env"
import { Channel } from "@/lib/types/channel"
import { auth } from "@clerk/nextjs/server"
import { cache } from "react"

export const getChannelById = cache(async (id: string) => {
  const { getToken, userId } = await auth()
  try {
    if (!userId) {
      throw new Error("unauthenticated")
    }
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/channel?channelId=${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
    })
    if (!res.ok) {
      return { error: "Failed to fetch channel" }
    }
    const { data } = await res.json()
    return data as Channel
  } catch (e) {
    throw e
  }
}
)
