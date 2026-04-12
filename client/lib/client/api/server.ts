import { getPublicApiUrl } from "@/lib/env"

export default async function getServerById(serverID: string) {

  try {
    const base = getPublicApiUrl()

    const res = await fetch(`${base}/server?serverID=${serverID}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    })
    if (!res.ok) throw new Error(res.statusText)

    return await res.json()
  } catch (e) {
    throw e
  }
}
