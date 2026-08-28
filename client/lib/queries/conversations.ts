import "server-only";

import { getPublicApiUrl } from "@/lib/env";
import type { Conversation, ConversationDetail } from "@/types/conversation";
import { auth } from "@clerk/nextjs/server";

export async function getAllConversations() {
  try {
    const { getToken } = await auth()
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/conversation`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch conversations");
    }

    const { data } = await res.json();
    return data as Conversation[];
  } catch (e) {
    throw e
  }
}

export async function getConversationById(channelId: string) {
  try {
    const { getToken } = await auth()
    const token = await getToken()

    const res = await fetch(
      `${getPublicApiUrl()}/conversation/find-one?channelId=${channelId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Authorization": `Bearer ${token}`
        },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return { error: "Failed to fetch conversation" };
    }

    const { data } = await res.json();
    return data as ConversationDetail;
  } catch (e) {
    throw e
  }
}
