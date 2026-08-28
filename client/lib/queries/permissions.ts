import "server-only"

import { getPublicApiUrl } from "@/lib/env"
import { auth } from "@clerk/nextjs/server"

export async function hasPermission(server_id: string, perm_key: string): Promise<boolean> {
  const { getToken } = await auth()
  const token = await getToken()

  const res = await fetch(`${getPublicApiUrl()}/permission/has-permission?server_id=${server_id}&perm-key=${perm_key}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Authorization": `Bearer ${token}`
    }
  })

  const payload = await res.json().catch(() => ({ success: false, message: "Invalid response from server" }))

  if (!res.ok || !payload.success) {
    throw new Error(payload.message || "Failed to check permission")
  }

  return payload.data
}
