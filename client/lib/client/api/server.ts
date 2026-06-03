import { getPublicApiUrl } from "@/lib/env"
import { getToken } from "@clerk/nextjs"



export default async function getServerById(serverID: string) {

  try {
    const base = getPublicApiUrl()

    const token = await getToken()
    const res = await fetch(`${base}/server?serverID=${serverID}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })
    if (!res.ok) throw new Error(res.statusText)

    return await res.json()
  } catch (e) {
    throw e
  }
}

