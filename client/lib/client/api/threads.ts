import { apiFetcher } from "@/lib/utils"

export async function getThreadById(id: string) {
  return apiFetcher(`threads?thread_id=${id}`)
}
