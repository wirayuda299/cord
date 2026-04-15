'server-only'

import { getPublicApiUrl } from "@/lib/env"
import { Invitation } from "@/lib/types/invitation"
import { function } from "zod"

export async function getAllInvitation(serverId: string): Promise<Invitation[]> {

  const base = getPublicApiUrl()
  const res = await fetch(`${base}/invitation/find-all?serverID=${serverId}`, {
    headers: {
      "Content-Type": "application/json"
    },
    method: "GET",
  })

  if (!res.ok) throw new Error("Failed to fetch invitations")


  return await res.json().then(i => i.data) as Invitation[]
}

export async function findInvitationByCode(code: string): Promise<Invitation> {
  try {
    const res = await fetch(`${getPublicApiUrl()}/invitation/find-one?code=${code}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (!res.ok) {
      throw new Error("Failed to fetch invitation")
    }

    return await res.json().then(d => d.data)
  } catch (e) {
    throw e
  }

}
