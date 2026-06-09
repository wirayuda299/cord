import { getPublicApiUrl } from "@/lib/env"
import { RolePermission } from "@/lib/types/permission"

export async function findPermissionByRoleId(roleId: string, token: string | null): Promise<RolePermission | null> {
  const base = getPublicApiUrl()

  const res = await fetch(`${base}/permission/find?role_id=${roleId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    }
  })
  const data = await res.json()
  if (data.data && data.data.length >= 0) {
    return data.data[0]
  }
  return null
}

export async function hasPermission(server_id: string, perm_key: string, token: string | null): Promise<boolean> {
  try {
    const res = await fetch(`${getPublicApiUrl()}/permission/has-permission?server_id=${server_id}&perm-key=${perm_key}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })

    if (!res.ok) {
      throw new Error("Failed to check permission")
    }
    const data = await res.json()
    return data.data
  } catch (e) {
    throw e
  }
}
