'use server'

import { getPublicApiUrl } from "@/lib/env"
import { auth } from "@clerk/nextjs/server"

export async function sendFriendRequest(addressee_id: string) {

  if (!addressee_id) {
    return {
      error: "Targeted user id is missing"
    }
  }

  const { getToken } = await auth()
  const token = await getToken()

  const res = await fetch(`${getPublicApiUrl()}/friends/send-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      addressee_id
    })
  })


  if (!res.ok) {
    return {
      error: await res.json().catch(() => null)
    }
  }
}
