'use server'

import { getPublicApiUrl } from "@/lib/env";
import { APIResponse } from "@/types/response";
import { auth } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";


export async function deleteThread(thread_id: string, server_id: string): Promise<APIResponse> {
  const { getToken } = await auth.protect();
  try {

    const token = await getToken()
    const res = await fetch(`${getPublicApiUrl()}/threads/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        thread_id,
        server_id
      })
    });

    const json: APIResponse = await res.json().catch(() => null)
    if (!res.ok) {
      return {
        message: json.message ?? "Failed to delete thread",
        success: false
      }
    }

    updateTag('messages')
    return {
      message: "thread deleted",
      success: true
    }

  } catch (err) {
    return {
      message: "Failed to delete thread",
      success: false
    }
  }
}
