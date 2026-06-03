import "server-only";

import { getPublicApiUrl } from "@/lib/env";
import type { Message, PinnedMessage } from "@/lib/types/chat";
import { auth } from "@clerk/nextjs/server";

export async function getAllMessagesByChannelId(channelId: string) {

  try {
    const { getToken } = await auth()
    const token = await getToken()

    const response = await fetch(`${getPublicApiUrl()}/messages?channelId=${channelId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      next: {
        tags: ["messages"]
      }
    });
    if (!response.ok) {
      return { error: "Failed to get all messages" };
    }
    const { data } = await response.json();
    return data as Message[];
  } catch (e) {
    throw e
  }
}

export async function getAllPinnedMessages(channelId: string) {
  try {
    const { getToken } = await auth()
    const token = await getToken()

    const response = await fetch(`${getPublicApiUrl()}/messages/pin/find-all?channelID=${channelId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      next: {
        tags: ["pinnedMessages"],
      },
    });
    const data = await response.json();
    return data.data as PinnedMessage[];
  } catch (e) {
    throw e
  }
}
