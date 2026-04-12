"use server"

import { getPublicApiUrl } from "@/lib/env"
import {
  createChannelSchema,
  type CreateChannelServer,
} from "@/lib/validation/channel"
import { updateTag } from "next/cache"
import { ZodError } from "zod"

export async function createChannel(data: CreateChannelServer) {
  try {
    const parsed = createChannelSchema.safeParse({
      name: data.name,
      type: data.type,
    })
    if (!parsed.success) {
      return { error: parsed.error.message }
    }

    const base = getPublicApiUrl()
    const res = await fetch(`${base}/channel/create`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        name: parsed.data.name,
        type: parsed.data.type,
        created_by: "usr_001",
        category_id: data.categoryID,
        server_id: data.serverID
      }),
    })
    if (!res.ok) {
      const result = await res.json()
      console.log(result)
      return { error: result.message }
    }
    updateTag("channels")
    return { error: null }
  } catch (e) {
    if (e instanceof ZodError) {
      return { error: e.message }
    }
    return { error: (e as Error).message }
  }
}
