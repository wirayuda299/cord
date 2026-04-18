"use server"

import { getPublicApiUrl } from "@/lib/env"

type UpdateServerProfileProps = {
  serverId: string
  userId: string
  payload: {
    username?: string
    avatar?: string
    avatar_asset_id?: string
    bio?: string
  }
}

export async function updateServerProfile({ serverId, userId, payload }: UpdateServerProfileProps) {
  const res = await fetch(`${getPublicApiUrl()}/server/profile/update`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ server_id: serverId, user_id: userId, ...payload }),
  })

  if (!res.ok) {
    return { error: (await res.json()).message }
  }
  return { error: null }
}
