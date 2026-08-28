import "client-only";

import { apiFetcher } from "@/lib/fetcher"

type ServerDetail = {
  name: string
  logo: string
  banner_colors: string[]
  private: boolean
  description: string
}

export default async function getServerById(serverID: string) {
  return apiFetcher<ServerDetail>(`server?serverID=${serverID}`)
}

