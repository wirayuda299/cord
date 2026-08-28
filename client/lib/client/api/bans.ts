import { getPublicApiUrl } from "@/lib/env"
import { getToken } from "@clerk/nextjs"

export async function getBans(serverId: string) {
  const token = await getToken()
  try {

    const res = await fetch(`${getPublicApiUrl()}/server/bans?serverID=${serverId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
    })

    if (!res.ok) {
      return { error: (await res.json()).message, data: [] }
    }

    const result = await res.json()
    return { error: null, data: result.data }
  } catch (e) {
    throw e
  }
}
