"use server";

import { isUserJoin } from "@/lib/queries/members";
import { getPublicApiUrl } from "@/lib/env";
import { auth } from "@clerk/nextjs/server";
import { APIResponse } from "@/types/response";

export async function isMemberJoined(serverId: string): Promise<boolean> {
  await auth.protect();
  return await isUserJoin(serverId);
}

export async function isMemberBanned(serverId: string): Promise<APIResponse<boolean>> {
  const { getToken } = await auth.protect();
  try {
    const token = await getToken();

    const res = await fetch(`${getPublicApiUrl()}/members/is-banned?server_id=${serverId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    const response = await res.json().catch(() => null)
    if (!res.ok) {
      return {
        message: response.message,
        success: false
      }
    }

    return {
      message: "success",
      data: response.data,
      success: true
    };
  } catch (e) {
    return {
      message: "failed to get member status",
      success: false
    }
  }
}
