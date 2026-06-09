"use server";

import { getPublicApiUrl } from "@/lib/env";
import { auth } from "@clerk/nextjs/server";
import { refresh, revalidateTag, updateTag } from "next/cache";

export async function createThread(params: {
  channel_id: string;
  name: string;
  message_id: string;
  server_id: string;
}) {
  try {
    const base = getPublicApiUrl();
    const { getToken } = await auth()
    const token = await getToken()

    const response = await fetch(`${base}/threads/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      return { error: "Failed to create thread" };
    }
    revalidateTag("messages", "max")
    refresh()
    return { success: true };
  } catch (e) {
    return { error: e };
  }
}


export async function pinMessage(msg_id: string, channel_id: string, server_id: string) {
  try {
    const base = getPublicApiUrl();
    const { getToken } = await auth()
    const token = await getToken()

    const response = await fetch(`${base}/messages/pin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        msg_id,
        channel_id,
        server_id
      }),
    });

    if (!response.ok) {
      return { error: (await response.json()).message };
    }

    updateTag("pinnedMessages");
  } catch (e) {
    return { error: e };
  }
}

export async function deletePinnedMessage(id: string, server_id: string) {
  try {
    const base = getPublicApiUrl();
    const { getToken } = await auth()
    const token = await getToken()

    const res = await fetch(`${base}/messages/pin`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        message_id: id,
        server_id
      }),
    });

    if (res.ok) {
      updateTag("pinnedMessages");
      return await res.json();
    }
    return {
      error: (await res.json()).message as any,
    };
  } catch (e) {
    throw e;
  }
}

type DeleteMessageParams = {
  id: string;
  public_id: string;
  channel_id: string;
  server_id: string;
  path: string;
  thread_id?: string | null
};

export async function deleteMessage({
  id,
  public_id,
  channel_id,
  server_id,
  path,
}: DeleteMessageParams) {
  try {
    const base = getPublicApiUrl();
    const { getToken } = await auth()
    const token = await getToken()

    const res = await fetch(`${base}/messages`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        id,
        public_id,
        channel_id,
        server_id,
      }),
    });

    const response = await res.json();
    if (!res.ok) {
      throw new Error(response.message);
    }
  } catch (e) {
    throw e;
  }
}
