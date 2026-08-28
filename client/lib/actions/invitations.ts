"use server"

import { getPublicApiUrl } from "@/lib/env"
import { APIResponse } from "@/types/response";
import { auth } from "@clerk/nextjs/server"

export async function createInvitationCode(server_id: string, max_users: number = 10): Promise<APIResponse> {

  const { getToken } = await auth.protect();

  if (!server_id) return { message: "Server ID is missing", success: false }

  try {
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/invitation/create`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      method: "POST",
      body: JSON.stringify({
        server_id,
        max_users,
      })
    })

    const response: APIResponse = await res.json().catch(() => null)

    if (!res.ok) {
      return {
        message: response.message,
        success: false
      }
    }
    return {
      data: response.data,
      message: "invitation created",
      success: true
    }
  } catch (e) {
    return {
      message: "failed to create invitation",
      success: false
    }
  }
}

export async function joinServerByCode(code: string): Promise<APIResponse> {
  const { getToken } = await auth.protect();
  try {

    if (!code) return { message: "Invitation code is missing", success: false }

    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/invitation/join`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      method: "POST",
      body: JSON.stringify({
        code,
      })
    })

    const response: APIResponse = await res.json().catch(() => null)
    if (!res.ok) {
      return {
        message: response.message,
        success: false
      }
    }
    return {
      message: "successfully join a server",
      success: true
    }
  } catch (e) {
    return {
      message: "failed to join server",
      success: false
    }
  }
}
