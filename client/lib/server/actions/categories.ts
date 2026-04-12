"use server"

import { getPublicApiUrl } from "@/lib/env"
import type { CreateCategoryPayload } from "@/lib/types/category"
import { updateTag } from "next/cache"

export async function createCategory(payload: CreateCategoryPayload) {
  const base = getPublicApiUrl()
  const res = await fetch(`${base}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) return { error: data.message as string }
  updateTag("channels")
  return { error: null }
}
