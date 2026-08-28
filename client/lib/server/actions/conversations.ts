"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getPublicApiUrl } from "@/lib/env"
import type { APIResponse } from "@/lib/types/response"

export async function startConversation(formData: FormData): Promise<void> {
  const { getToken, userId } = await auth.protect()

  if (!userId) {
    throw new Error("unauthenticated")
  }
  const targetedUserId = formData.get("targeted_user_id")

  if (typeof targetedUserId !== "string" || !targetedUserId) {
    throw new Error("Target user id is missing")
  }

  try {
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/conversation/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        targeted_user_id: targetedUserId,
      }),
    })

    const payload: APIResponse<{ channel_id: string }> =
      await res.json().catch(() => ({
        success: false,
        message: "Invalid response from server",
      }))

    if (!res.ok || !payload.success) {
      throw new Error(
        payload.message || "Failed to create conversation"
      )
    }

    if (payload && payload.data) {
      redirect(`/direct-messages/${payload.data.channel_id}`)
    }
  } catch (error) {
    console.error("Failed to start conversation:", error)

    throw error
  }
}
