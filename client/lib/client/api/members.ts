import { getPublicApiUrl } from "@/lib/env"

export type Member = {
  id: string
  user_id: string
  username: string
  avatar_url: string
  avatar_id: string
  joined_at: string // ISO date string
  role: string | null
  role_id: string | null
  role_color: string | null
  server_id: string
}
export async function getAllMembers(serverID: string): Promise<Member[]> {
  const res = await fetch(`${getPublicApiUrl()}/members/find-all?serverID=${serverID}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!res.ok) {
    throw new Error("Failed to fetch members")
  }

  return await res.json().then(d => d.data) as Member[]
}
