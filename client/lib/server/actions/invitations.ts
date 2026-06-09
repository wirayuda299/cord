"use server"

import { getPublicApiUrl } from "@/lib/env"
import { auth } from "@clerk/nextjs/server"

export async function createInvitationCode(server_id: string, max_users: number = 10) {

  if (!server_id) return { error: "Server ID is missing" }

  const base = getPublicApiUrl()

  const { getToken } = await auth()
  const token = await getToken()

  const res = await fetch(`${base}/invitation/create`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Authorization": `Bearer ${token}`
    },
    method: "POST",
    body: JSON.stringify({
      server_id,
      max_users,
    })
  })

  if (!res.ok) {
    return {
      error: await res.json().then(d => d.message)
    }
  }
  return await res.json().then(c => c.data)
}

export async function joinServerByCode(code: string) {
  if (!code) return { error: "Invitation code is missing" }


  const { getToken } = await auth()
  const token = await getToken()

  const res = await fetch(`${getPublicApiUrl()}/invitation/join`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Authorization": `Bearer ${token}`
    },
    method: "POST",
    body: JSON.stringify({
      code,
    })
  })

  if (!res.ok) {
    return {
      error: await res.json().then((r) => r.message)
    }
  }
}
