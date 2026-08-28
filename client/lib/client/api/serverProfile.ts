import { apiFetcher } from "@/lib/utils"

export type ServerProfileData = {
  username: string
  avatar: string
  avatar_id: string
  bio: string
}

export async function getServerProfile(serverID: string): Promise<ServerProfileData> {
  return apiFetcher<ServerProfileData>(`server/profile?server_id=${serverID}`)
}
