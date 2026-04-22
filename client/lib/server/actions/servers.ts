"use server"

import { getPublicApiUrl } from "@/lib/env"
import { UpdateServerType } from "@/lib/validation/server"
import { updateTag } from "next/cache"

type UpdateServerProps = {
  serverId: string
  payload: Partial<{
    name: string
    icon: string
    icon_asset_id: string
    banner_colors: string[]
    description: string
    private: boolean
  }>
  fields: Partial<Record<keyof UpdateServerType, boolean | boolean[]>>
}

export async function updateServer({ serverId, payload, fields }: UpdateServerProps) {
  const base = getPublicApiUrl()

  const update: Partial<typeof payload> = {}
  if (fields.name) update.name = payload.name
  if (fields.icon) {
    update.icon = payload.icon
    update.icon_asset_id = payload.icon_asset_id
  }
  if (fields.banner) update.banner_colors = payload.banner_colors
  if (fields.description) update.description = payload.description
  if (fields.private) update.private = payload.private

  const res = await fetch(`${base}/server/update`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ server_id: serverId, ...update }),
  })

  if (!res.ok) {
    return { error: (await res.json()).message }
  }

  updateTag("servers")
  return { error: null }
}

export async function joinServer(server_id: string, user_id: string) {
  if (!server_id) return { error: "Server ID is missing" }
  if (!user_id) return { error: "User ID is missing" }

  const base = getPublicApiUrl()
  const res = await fetch(`${base}/server/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ server_id, user_id }),
  })

  if (!res.ok) {
    return { error: (await res.json()).message }
  }
  updateTag("servers")
  return { error: null }
}

export async function createServer(name: string, ownerId: string) {
  if (name === "") {
    return { error: "Server name is required" }
  }

  const base = getPublicApiUrl()
  const res = await fetch(`${base}/server/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      owner_id: ownerId,
    }),
  })

  if (!res.ok) {
    return {
      error: (await res.json()).message,
    }
  }
  updateTag("servers")
  return { error: null }
}
