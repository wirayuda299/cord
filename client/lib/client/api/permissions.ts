import { getPublicApiUrl } from "@/lib/env"
import { RolePermission } from "@/lib/types/permission"
import { getToken } from "@clerk/nextjs"

export async function findPermissionByRoleId(roleId: string): Promise<RolePermission | null> {

  const base = getPublicApiUrl()

  const token = await getToken()
  const res = await fetch(`${base}/permission/find?role_id=${roleId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    }
  })
  const data = await res.json()
  if (data.data.length >= 0) {
    return data.data[0]
  }
  return null
}
