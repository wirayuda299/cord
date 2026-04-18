import { getPublicApiUrl } from "@/lib/env"

export type ServerProfileData = {
  username: string
  avatar: string
  avatar_id: string
  bio: string
}

export async function getServerProfile(serverID: string, userID: string): Promise<ServerProfileData> {
  const res = await fetch(
    `${getPublicApiUrl()}/server/profile?server_id=${serverID}&user_id=${userID}`,
    { headers: { "Content-Type": "application/json" } }
  )
  if (!res.ok) throw new Error("Failed to fetch server profile")
  return (await res.json()).data as ServerProfileData
}
