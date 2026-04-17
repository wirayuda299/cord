'use server'

import { getPublicApiUrl } from "@/lib/env"

type CreateRolePayload = {
  name: string
  server_id: string
  color: string
  icon: string
  hoist: boolean
  mentionable: boolean
  permission_ids?: string[]
}

type CreateRoleApiResponse = {
  message?: string
  success?: boolean
  data?: { id?: string }
}

export async function createRole(
  p: CreateRolePayload
): Promise<{ error: string } | undefined> {
  const {
    name,
    server_id,
    color,
    icon,
    hoist,
    mentionable,
    permission_ids = [],
  } = p
  const base = getPublicApiUrl()

  const res = await fetch(`${base}/roles/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      server_id,
      color,
      icon,
      hoist,
      mentionable,
      permission_ids,
      created_by: "usr_001"
    })
  })

  const json = (await res.json().catch(() => ({}))) as CreateRoleApiResponse

  if (!res.ok) {
    return { error: json.message ?? res.statusText }
  }
}

type UpdateRolePayload = {
  role_id: string
  server_id: string
  name?: string
  color?: string
  icon?: string
  hoist?: boolean
  mentionable?: boolean
  permission_ids?: string[]
}

export async function updateRole(
  p: UpdateRolePayload
): Promise<{ error: string } | undefined> {

  console.log("Payload client -> ", p)
  const base = getPublicApiUrl()
  const res = await fetch(`${base}/roles/update`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  })
  const json = (await res.json().catch(() => ({}))) as { message?: string }
  console.log("Error -> ", json)
  if (!res.ok) {
    return { error: json.message ?? res.statusText }
  }
}
