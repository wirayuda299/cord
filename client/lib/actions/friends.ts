'use server'

import { getPublicApiUrl } from "@/lib/env"
import { APIResponse } from "@/types/response";
import { auth } from "@clerk/nextjs/server"

export async function sendFriendRequest(addressee_id: string): Promise<APIResponse> {

  const { getToken, userId } = await auth.protect();

  if (!userId) {
    return {
      message: "unauthenticated",
      success: false
    }
  }

  try {
    if (!addressee_id) {
      return {
        message: "Targeted user id is missing",
        success: false
      }
    }
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/friends/send-request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        addressee_id
      })
    })


    if (!res.ok) {
      const response: APIResponse = await res.json().catch(() => null)
      return {
        message: response.message ?? "failed to send friend request",
        success: false
      }
    }
    return {
      message: "friend request sended",
      success: true
    }
  } catch (e) {
    return {
      message: "failed to send friend request",
      success: false
    }
  }
}
