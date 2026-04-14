'server-only'

import { getPublicApiUrl } from "@/lib/env"

export async function getAllInvitation(serverId: string) {

  const base = getPublicApiUrl()
  const res = await fetch(`${base}/invitation/find-all?serverID=${serverId}`, {
    headers: {
      "Content-Type": "application/json"
    },
    method: "GET",
  })

  if (!res.ok) throw new Error("Failed to fetch invitations")

  return (await res.json()).data

}
