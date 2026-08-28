import { apiFetcher } from "@/lib/utils"

export default async function getServerById(serverID: string) {
  return apiFetcher(`server?serverID=${serverID}`)
}

