import { getPublicApiUrl } from "@/lib/env";
import { Invitation } from "@/lib/types/invitation";


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

export async function deleteInvitationCode(code: string, deleted_by: string) {
  const base = getPublicApiUrl()

  const res = await fetch(`${base}/invitation/delete`, {
    method: "DELETE",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify({
      code,
      deleted_by
    })
  })

  if (!res.ok) {
    throw new Error("Failed to delete invitation code")
  }
}
