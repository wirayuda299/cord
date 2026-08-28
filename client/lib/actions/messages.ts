"use server";

import { getPublicApiUrl } from "@/lib/env";
import { APIResponse } from "@/types/response";
import { auth } from "@clerk/nextjs/server";
import { refresh, updateTag } from "next/cache";


type CreateThreadProps = {
  channel_id: string;
  name: string;
  message_id: string;
  server_id: string;
}

export async function createThread(params: CreateThreadProps): Promise<APIResponse> {
  const { getToken } = await auth.protect();

  try {
    const token = await getToken()
    const response = await fetch(`${getPublicApiUrl()}/threads/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const res: APIResponse = await response.json().catch(() => null)
      return { message: res.message, success: false };
    }
    updateTag("messages")
    refresh()
    return { success: true, message: "thread created" };
  } catch (e) {
    return { message: "failed to create thread", success: false };
  }
}


export async function pinMessage(msg_id: string, channel_id: string, server_id: string): Promise<APIResponse> {
  const { getToken } = await auth.protect();
  try {

    const token = await getToken()
    const res = await fetch(`${getPublicApiUrl()}/messages/pin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        msg_id,
        channel_id,
        server_id
      }),
    });

    const response: APIResponse = await res.json().catch(() => null)

    if (!res.ok) {
      return {
        message: response.message,
        success: false
      };
    }

    updateTag("pinnedMessages");
    return {
      message: "message pinned",
      success: true
    }

  } catch (e) {
    return { message: "failed to pin message", success: false };
  }
}

export async function deletePinnedMessage(id: string, server_id: string): Promise<APIResponse> {
  const { getToken } = await auth.protect();
  try {

    const token = await getToken()
    const res = await fetch(`${getPublicApiUrl()}/messages/pin`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        message_id: id,
        server_id
      }),
    });

    const response: APIResponse = await res.json().catch(() => null)
    if (res.ok) {
      updateTag("pinnedMessages");
      return {
        message: "message deleted",
        success: true
      };
    }
    return {
      message: response.message,
      success: false
    };
  } catch (e) {
    return {
      message: "failed to delete pinned message",
      success: false
    };
  }
}

type DeleteMessageParams = {
  id: string;
  public_id: string;
  channel_id: string;
  server_id: string;
  thread_id?: string | null
};

export async function deleteMessage({
  id,
  public_id,
  channel_id,
  server_id,
}: DeleteMessageParams): Promise<APIResponse> {
  const { getToken } = await auth.protect();
  try {

    const token = await getToken()
    const res = await fetch(`${getPublicApiUrl()}/messages`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        id,
        public_id,
        channel_id,
        server_id,
      }),
    });

    const response: APIResponse = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        message: response.message,
        success: false
      }
    }

    return {
      message: "message has been deleted",
      success: true
    }
  } catch (e) {
    return {
      message: "failed to delete message",
      success: false
    }
  }
}
