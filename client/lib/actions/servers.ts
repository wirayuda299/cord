"use server"

import { getPublicApiUrl } from "@/lib/env"

import { auth } from "@clerk/nextjs/server"
import { UpdateServerType } from "@/lib/validations/server"

import { updateTag } from "next/cache"
import { APIResponse } from "@/types/response"

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


export async function joinServer(server_id: string, user_id: string): Promise<APIResponse> {
  const { getToken } = await auth.protect();

  if (!server_id) return { message: "Server ID is missing", success: false }
  if (!user_id) return { message: "User ID is missing", success: false }

  try {
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/server/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ server_id }),
    })

    const json: APIResponse = await res.json().catch(() => null)
    if (!res.ok) {
      return { message: json.message ?? "failed to join server", success: false }
    }


    updateTag("servers")
    return { message: "successfully join a server", success: true }
  } catch (e) {
    return { message: "failed to join server", success: false }
  }
}

export async function updateServer({ serverId, payload, fields }: UpdateServerProps): Promise<APIResponse> {
  const { getToken, userId } = await auth.protect();

  if (!userId) {
    return {
      message: "unauthenticated",
      success: false
    }
  }

  try {
    const update: Partial<typeof payload> = {}
    if (fields.name) update.name = payload.name
    if (fields.icon) {
      update.icon = payload.icon
      update.icon_asset_id = payload.icon_asset_id
    }
    if (fields.banner) update.banner_colors = payload.banner_colors
    if (fields.description) update.description = payload.description
    if (fields.private) update.private = payload.private

    const token = await getToken()
    const res = await fetch(`${getPublicApiUrl()}/server/update`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ server_id: serverId, ...update }),
    })
    const response: APIResponse = await res.json().catch(() => null)

    if (!response.success) {
      return {
        message: response.message ?? "failed to update server",
        success: false
      }
    }

    updateTag(`servers`)

    return {
      message: "server updated",
      success: true
    }
  } catch (e) {

    return {
      message: "failed to update server",
      success: false
    }
  }
}

export async function createServer(name: string): Promise<APIResponse> {
  const { getToken } = await auth.protect();
  if (name === "") {
    return { success: false, message: "Server name is required" }
  }

  try {

    const token = await getToken()
    const res = await fetch(`${getPublicApiUrl()}/server/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
      }),
    })

    const json: APIResponse = await res.json().catch(() => null)
    if (!res.ok) {
      return {
        message: json.message ?? "failed to create server",
        success: false
      }
    }
    updateTag("servers")
    return {
      message: "server created",
      success: true
    }
  } catch (e) {
    return {
      message: "failed to create server",
      success: false
    }
  }
}

export async function updateSafetySetup(serverId: string, data: {
  verificationLevel: string
  contentFilter: string
  require2FA: boolean
  dmSpamFilter: boolean
  defaultNotifications: string
}): Promise<APIResponse> {
  const { getToken } = await auth.protect();
  try {
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/server/safety`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        server_id: serverId,
        verification_level: data.verificationLevel,
        require_2_fa: data.require2FA,
        content_filter: data.contentFilter,
        default_notification: data.defaultNotifications,
        dm_spam_filter: data.dmSpamFilter,
      }),
    })

    const json: APIResponse = await res.json().catch(() => null)
    if (!res.ok) {
      return { message: json.message ?? "failed to update safety rules", success: false }
    }

    return {
      message: "safety rules updated",
      success: true
    }
  } catch (e) {
    return { message: "failed to update safety rules", success: false }
  }
}



export async function banMember(serverId: string, memberId: string, reason: string) {
  const { getToken } = await auth.protect();
  try {
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/server/bans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        server_id: serverId,
        member_id: memberId,
        reason,
      }),
    })

    if (!res.ok) {
      return { error: (await res.json()).message }
    }

    updateTag("servers")
    return { error: null }
  } catch (e) {
    throw e
  }
}

export async function kickMember(memberId: string, serverId: string): Promise<APIResponse> {
  const { getToken } = await auth.protect();
  try {
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/members/kick`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        member_id: memberId,
        server_id: serverId,
      }),
    })

    const json: APIResponse = await res.json().catch(() => null)
    if (!res.ok) {
      return { message: json?.message ?? "failed to kick member", success: false }
    }

    updateTag("servers")
    return { message: "member kicked", success: true }
  } catch (e) {
    return { message: "failed to kick member", success: false }
  }
}

export async function unbanMember(serverId: string, memberId: string): Promise<APIResponse> {
  const { getToken } = await auth.protect();
  try {
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/server/bans?serverID=${serverId}&memberID=${memberId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
    })

    const json: APIResponse = await res.json().catch(() => null)
    if (!res.ok) {
      return { message: json.message ?? "failed to unban member", success: false }
    }

    return { message: "member unbanned", success: true }
  } catch (e) {
    return { message: "failed to unban member", success: false }
  }
}

export async function deleteServer(serverId: string): Promise<APIResponse> {
  const { getToken } = await auth.protect();

  try {
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/server?serverID=${serverId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
    })

    const json: APIResponse = await res.json().catch(() => null)
    if (!res.ok) {
      return { message: json.message ?? "failed to delete server", success: false }
    }

    updateTag("servers")
    return {
      message: "server deleted",
      success: true
    }

  } catch (e) {
    return { message: "failed to delete server", success: false }
  }
}





