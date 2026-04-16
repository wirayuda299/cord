import { getPublicApiUrl } from "@/lib/env"
import { RolePermission } from "@/lib/types/permission"

export async function findPermissionByRoleId(roleId: string): Promise<RolePermission | null> {

  const base = getPublicApiUrl()

  const res = await fetch(`${base}/permission/find?role_id=${roleId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })
  const data = await res.json()
  if (data.data.length >= 0) {
    return data.data[0]
  }
  return null
}
