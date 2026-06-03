"use server"

import { getPublicApiUrl } from "@/lib/env"
import type { CreateCategoryPayload } from "@/lib/types/category"
import { auth } from "@clerk/nextjs/server"
import { updateTag } from "next/cache"

export async function createCategory(payload: CreateCategoryPayload) {
  try {
    const { getToken } = await auth()
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message as string }
    updateTag("channels")
    return { error: null }
  } catch (e) {
    return {
      error: e
    }
  }
}
