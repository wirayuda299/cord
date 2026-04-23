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
  if (!res.ok) throw new Error("Failed to fetch all role")

  return await res.json().then(d => d.data as Role[])
}


export type UserRole = {
  user_id: string
  username: string
  avatar_url: string
  role_id: string
}

export async function getAllMemberByRole(roleID: string): Promise<UserRole[]> {

  const res = await fetch(`${getPublicApiUrl()}/roles/find-all-members?role_id=${roleID}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })
  if (!res.ok) throw new Error("Failed to fetch member role")
  return await res.json().then(d => d.data as UserRole[])
}

export async function assignRole(member_user_id: string, server_id: string, role_id: string, assigned_by: string) {
  const res = await fetch(`${getPublicApiUrl()}/roles/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ member_user_id, server_id, role_id, assigned_by }),
  })
  if (!res.ok) throw new Error("Failed to assign role")
}

export async function unassignRole(member_user_id: string, server_id: string, role_id: string) {
  const res = await fetch(`${getPublicApiUrl()}/roles/unassign`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ member_user_id, server_id, role_id }),
  })
  if (!res.ok) throw new Error("Failed to unassign role")
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
