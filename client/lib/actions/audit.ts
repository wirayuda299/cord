import { getToken } from "@clerk/nextjs"
import { getPublicApiUrl } from "../env"

export async function getAuditLogs(serverId: string) {
  const token = await getToken()
  try {

    const res = await fetch(`${getPublicApiUrl()}/server/audit-logs?serverID=${serverId}`, {
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
