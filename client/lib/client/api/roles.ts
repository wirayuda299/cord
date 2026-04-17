import { getPublicApiUrl } from "@/lib/env"
import { Role } from "@/lib/types/role"

export async function getAllRoles(serverID: string): Promise<Role[]> {

  const base = getPublicApiUrl()
  const res = await fetch(`${base}/roles/find-all?serverID=${serverID}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })
  const data = await res.json()
  return data.data as Role[]
}

export async function deleteRole(role_id: string, user_id: string) {

  const res = await fetch(`${getPublicApiUrl()}/roles`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ role_id, user_id })
  })
  if (!res.ok) {
    throw new Error("Failed to delete role")
  }
}
