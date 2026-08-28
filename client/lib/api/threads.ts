import "client-only";

import { apiFetcher } from "@/lib/fetcher"

export async function getThreadById(id: string) {
  return apiFetcher<{ name: string }>(`threads?thread_id=${id}`)
}
