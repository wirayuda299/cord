import { getPublicApiUrl } from "@/lib/env";
import { getToken } from "@clerk/nextjs";

export async function getSafetySetup(serverId: string) {

  try {
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/server/safety?serverID=${serverId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
    })

    if (!res.ok) {
      return { error: (await res.json()).message, data: null }
    }

    const result = await res.json()
    return { error: null, data: result.data }
  } catch (e) {
    throw e
  }
}
