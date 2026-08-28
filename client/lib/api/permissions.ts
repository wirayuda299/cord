import "client-only";

import { RolePermission } from "@/types/permission"
import { apiFetcher } from "@/lib/fetcher"

export async function findPermissionByRoleId(roleId: string): Promise<RolePermission | null> {
  const data = await apiFetcher<RolePermission[]>(`permission/find?role_id=${roleId}`)
  return data && data.length > 0 ? data[0] : null
}

export async function hasPermission(server_id: string, perm_key: string): Promise<boolean> {
  return apiFetcher<boolean>(`permission/has-permission?server_id=${server_id}&perm-key=${perm_key}`)
}
