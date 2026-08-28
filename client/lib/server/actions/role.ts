'use server'

import { getPublicApiUrl } from "@/lib/env"
import { APIResponse } from "@/lib/types/response"
import { auth } from "@clerk/nextjs/server"

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

export async function createRole(p: CreateRolePayload): Promise<APIResponse<CreateRoleApiResponse>> {
  const { getToken } = await auth.protect();

  try {
    const {
      name,
      server_id,
      color,
      icon,
      hoist,
      mentionable,
      permission_ids = [],
    } = p

    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/roles/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        server_id,
        color,
        icon,
        hoist,
        mentionable,
        permission_ids,
      })
    })

    const json: APIResponse<CreateRoleApiResponse> = await res.json().catch(() => null)

    if (!res.ok) {
      return {
        message: json.message ?? "failed to create role",
        success: false
      }
    }

    return {
      message: "role created",
      success: false
    }
  } catch (e) {
    return {
      message: "failed to create role",
      success: false
    }
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
): Promise<APIResponse> {

  const { getToken } = await auth.protect()
  try {
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/roles/update`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(p),
    })
    const json: APIResponse = await res.json().catch(() => null)
    if (!res.ok) {
      return {
        message: json.message ?? "failed to update role",
        success: false
      }
    }

    return {
      message: "role updated",
      success: true
    }
  } catch (e) {
    return {
      message: "failed to update role",
      success: false
    }
  }
}
