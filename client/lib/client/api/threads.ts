import { getPublicApiUrl } from "@/lib/env"
import { getToken } from "@clerk/nextjs"

export async function getThreadById(id: string) {
  try {

    const token = await getToken()
    const res = await fetch(`${getPublicApiUrl()}/threads?thread_id=${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })

    if (!res.ok) {
      throw new Error("Failed to fetch thread info")
    }
    return (await res.json()).data
  } catch (e) {
    throw e
  }
}
