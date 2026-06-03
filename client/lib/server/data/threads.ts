import 'server-only'

import { getPublicApiUrl } from '@/lib/env'
import { auth } from '@clerk/nextjs/server'

export async function getAllThreadMessages(thread_id: string) {

  try {
    const { getToken } = await auth()
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/threads/find-messages?thread_id=${thread_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
    })

    if (!res.ok) {
      return {
        error: "Failed to fetch thread messages"
      }
    }
    const data = await res.json()
    return data.data
  } catch (e) {
    throw e
  }
}
