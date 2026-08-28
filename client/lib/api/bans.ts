import { apiFetcher } from "@/lib/fetcher"
import { BannedMemberRow } from "@/types/bans"

export async function getBans(serverId: string) {
  return apiFetcher<BannedMemberRow[]>(`server/bans?serverID=${serverId}`)
}
