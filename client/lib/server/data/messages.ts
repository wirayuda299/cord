import "server-only";

import { getPublicApiUrl } from "@/lib/env";
import type { Message, PinnedMessage } from "@/lib/types/chat";

export async function getAllMessagesByChannelId(channelId: string) {
  const base = getPublicApiUrl();
  const response = await fetch(`${base}/messages?channelId=${channelId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
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
}

export async function getAllPinnedMessages(channelId: string) {
  const base = getPublicApiUrl();
  const response = await fetch(`${base}/messages/pin/find-all?channelID=${channelId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: {
      tags: ["pinnedMessages"],
    },
  });
  const data = await response.json();
  return data.data as PinnedMessage[];
}
