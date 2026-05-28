import { getPublicApiUrl } from "@/lib/env"

export async function getThreadById(id: string) {
  try {

    const res = await fetch(`${getPublicApiUrl()}/threads?thread_id=${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
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
