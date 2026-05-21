'use server'

import { getPublicApiUrl } from "@/lib/env"

export async function sendFriendRequest(addressee_id: string) {

  if (!addressee_id) {
    return {
      error: "Targeted user id is missing"
    }
  }
  const res = await fetch(`${getPublicApiUrl()}/friends/send-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      requester_id: "usr_001",
      addressee_id
    })
  })

  console.log(res)

  if (!res.ok) {
    return {
      error: await res.json().catch(() => null)
    }
  }
}
