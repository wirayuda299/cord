"use server"

import { getPublicApiUrl } from "@/lib/env"

export async function createInvitationCode(server_id: string, max_users: number = 10) {

  if (!server_id) return { error: "Server ID is missing" }

  const base = getPublicApiUrl()

  return await fetch(`${base}/invitation/create`, {
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST",
    body: JSON.stringify({
      server_id,
      max_users
    })
  })
}

export async function joinServerByCode(code: string, user_id: string) {
  if (!code) return { error: "Invitation code is missing" }
  if (!user_id) return { error: "User ID is missing" }


  const base = getPublicApiUrl()

  return await fetch(`${base}/invitation/join`, {
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST",
    body: JSON.stringify({
      code,
      user_id
    })
  })
}
