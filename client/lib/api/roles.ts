import "client-only";

import { getPublicApiUrl } from "@/lib/env"
import { Role } from "@/types/role"
import { apiFetcher } from "@/lib/fetcher"
import { getToken } from "@clerk/nextjs"

export async function getAllRoles(serverID: string): Promise<Role[]> {
  return apiFetcher<Role[]>(`roles/find-all?serverID=${serverID}`)
}


export type UserRole = {
  user_id: string
  username: string
  avatar_url: string
  role_id: string
}

export async function getAllMemberByRole(roleID: string): Promise<UserRole[]> {
  return apiFetcher<UserRole[]>(`roles/find-all-members?role_id=${roleID}`)
}

export async function assignRole(member_user_id: string, server_id: string, role_id: string) {
  const token = await getToken()
  const res = await fetch(`${getPublicApiUrl()}/roles/assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ member_user_id, server_id, role_id }),
  })
  if (!res.ok) throw new Error("Failed to assign role")
}

export async function unassignRole(member_user_id: string, server_id: string, role_id: string) {
  const token = await getToken()
  const res = await fetch(`${getPublicApiUrl()}/roles/unassign`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ member_user_id, server_id, role_id }),
  })
  if (!res.ok) throw new Error("Failed to unassign role")
}

export async function deleteRole(role_id: string, server_id: string) {

  const token = await getToken()
  const res = await fetch(`${getPublicApiUrl()}/roles`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ role_id, server_id })
  })
  console.log(await res.json())
  if (!res.ok) {
    throw new Error("Failed to delete role")
  }
}
