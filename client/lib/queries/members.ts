import { getPublicApiUrl } from "@/lib/env"
import { auth } from "@clerk/nextjs/server"

export type Member = {
  id: string
  user_id: string
  username: string
  avatar_url: string
  avatar_id: string
  joined_at: string
  role: string | null
  role_id: string | null
  role_color: string | null
  server_id: string
  is_banned: boolean
}

export async function isUserJoin(server_id: string): Promise<boolean> {
  try {

    const res = await fetch(`${getPublicApiUrl()}/members/is-join?server_id=${server_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${await (await auth()).getToken()}`
      },
    })


    return await res.json().then(d => d.data)
  } catch (e) {
    throw e
  }
}

export async function getAllMembersInServer(serverId: string): Promise<Member[]> {
  try {
    const { getToken } = await auth()
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/members/find-all?serverID=${serverId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
    })

    const data = await res.json()
    return data.data as Member[]
  } catch (e) {
    console.error("Failed to fetch server members:", e)
    return []
  }
}
