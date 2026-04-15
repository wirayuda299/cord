import { getPublicApiUrl } from "@/lib/env"

export async function isUserJoin(server_id: string, user_id: string): Promise<boolean> {
  try {
    const base = getPublicApiUrl()

    const res = await fetch(`${base}/members/is-join?user_id=${user_id}&server_id=${server_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (!res.ok) {
      throw new Error("Failed to get user status")
    }

    return await res.json().then(d => d.data)
  } catch (e) {
    throw e
  }
}
