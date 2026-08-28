import { getPublicApiUrl } from "@/lib/env";
import { Invitation } from "@/lib/types/invitation";
import { apiFetcher } from "@/lib/utils";
import { getToken } from "@clerk/nextjs";


export async function getAllInvitation(serverId: string): Promise<Invitation[]> {
  return apiFetcher<Invitation[]>(`invitation/find-all?serverID=${serverId}`)
}

export async function deleteInvitationCode(code: string) {
  const base = getPublicApiUrl()

  const token = await getToken()
  const res = await fetch(`${base}/invitation/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    },

    body: JSON.stringify({
      code,
    })
  })

  if (!res.ok) {
    throw new Error("Failed to delete invitation code")
  }
}
