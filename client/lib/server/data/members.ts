import { getPublicApiUrl } from "@/lib/env"
import { auth } from "@clerk/nextjs/server"

export async function isUserJoin(server_id: string): Promise<boolean> {
  try {
    const { getToken } = await auth()
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/members/is-join?server_id=${server_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
    })

    if (!res.ok) {
      throw new Error("Failed to get user status")
    }

    return await res.json().then(d => d.data)
  } catch (e) {
    throw e
  }
}
