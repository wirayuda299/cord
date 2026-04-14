import { getPublicApiUrl } from "@/lib/env"

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
