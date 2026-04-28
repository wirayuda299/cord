'use server'

import { getPublicApiUrl } from "@/lib/env"

export async function sendFriendRequest(addressee_id: string) {

  if (!addressee_id) {
    return {
      error: "Targeted user id is missing"
    }
  }
  const res = await fetch(`${getPublicApiUrl()}/friends/send-friend-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requester_id: "usr_001",
      addressee_id
    })
  })

  if (!res.ok) {
    return {
      error: await res.json().catch(e => e)
    }
  }
}
