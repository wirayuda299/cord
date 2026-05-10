import "server-only";

import { getPublicApiUrl } from "@/lib/env";
import type { Conversation, ConversationDetail } from "@/lib/types/conversation";

export async function getAllConversations(userId: string) {
  const res = await fetch(`${getPublicApiUrl()}/conversation?user_id=${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch conversations");
  }

  const { data } = await res.json();
  return data as Conversation[];
}

export async function getConversationById(channelId: string, userId: string) {
  const res = await fetch(
    `${getPublicApiUrl()}/conversation/find-one?channelId=${channelId}&user_id=${userId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return { error: "Failed to fetch conversation" };
  }

  const { data } = await res.json();
  return data as ConversationDetail;
}
