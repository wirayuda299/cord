"use server"

import { getPublicApiUrl } from "@/lib/env"
import {
  createChannelSchema,
  type CreateChannelServer,
} from "@/lib/validations/channel"
import { updateTag } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { APIResponse } from "@/types/response"

export async function createChannel(data: CreateChannelServer): Promise<APIResponse> {
  const { getToken, userId } = await auth.protect();
  try {

    if (!userId) {
      return {
        message: "unauthenticated",
        success: false
      }
    }

    const parsed = createChannelSchema.safeParse({
      name: data.name,
      type: data.type,
    })
    if (!parsed.success) {
      return {
        message: parsed.error.message,
        success: false
      }
    }
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/channel/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        name: parsed.data.name,
        type: parsed.data.type,
        category_id: data.categoryID,
        server_id: data.serverID
      }),
    })
    const result: APIResponse = await res.json().catch(() => null)
    if (res.ok && result.success) {
      updateTag("channels")
      return {
        message: result.message,
        success: true
      }
    }

    return {
      message: result.message,
      success: false
    }
  } catch (e) {

    return {
      message: "failed to create channel",
      success: false
    }
  }
}

export type UpdateChannelPayload = {
  channelId: string
  name: string
  topic: string
  categoryId: string | null
  serverId: string
}

export async function updateChannel(data: UpdateChannelPayload): Promise<APIResponse> {
  const { getToken, userId } = await auth.protect();
  try {
    if (!userId) {
      return {
        message: "unauthenticated",
        success: false
      }
    }

    const parsed = createChannelSchema.pick({ name: true, topic: true }).safeParse({
      name: data.name,
      topic: data.topic,
    })
    if (!parsed.success) {
      return {
        message: parsed.error.message,
        success: false
      }
    }
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/channel`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        channel_id: data.channelId,
        name: parsed.data.name,
        topic: parsed.data.topic ?? "",
        category_id: data.categoryId,
        server_id: data.serverId,
      }),
    })
    const result: APIResponse = await res.json().catch(() => null)
    if (res.ok && result.success) {
      updateTag("channels")
      return {
        message: result.message,
        success: true
      }
    }

    return {
      message: result.message,
      success: false
    }
  } catch (e) {
    return {
      message: "failed to update channel",
      success: false
    }
  }
}
