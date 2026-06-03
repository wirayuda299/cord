import { getPublicApiUrl } from "@/lib/env"
import { getToken } from "@clerk/nextjs"

export type ServerProfileData = {
  username: string
  avatar: string
  avatar_id: string
  bio: string
}

export async function getServerProfile(serverID: string): Promise<ServerProfileData> {
  const token = await getToken()

  const res = await fetch(`${getPublicApiUrl()}/server/profile?server_id=${serverID}`, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    }
  })
  if (!res.ok) throw new Error("Failed to fetch server profile")

  return (await res.json()).data as ServerProfileData
}
