import 'server-only'
import { getPublicApiUrl } from '@/lib/env'

export async function getAllThreadMessages(thread_id: string) {

  const res = await fetch(`${getPublicApiUrl()}/threads/find-messages?thread_id=${thread_id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  })

  if (!res.ok) {
    return {
      error: "Failed to fetch thread messages"
    }
  }
  const data = await res.json()
  return data.data
}
