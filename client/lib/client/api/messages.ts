import { getPublicApiUrl } from "@/lib/env";
import { TEMP_USR } from "@/lib/utils";

export async function editMessage({
  id,
  content,
  channel_id,
}: {
  id: string;
  content: string;
  channel_id: string;
}) {
  const res = await fetch(`${getPublicApiUrl()}/messages`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      id,
      content,
      user_id: TEMP_USR,
      channel_id,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to edit message");
  }

  return await res.json();
}

export async function addReaction({
  message_id,
  emoji,
}: {
  message_id: string;
  emoji: string;
}) {
  const res = await fetch(`${getPublicApiUrl()}/messages/reactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      message_id,
      user_id: TEMP_USR,
      emoji,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to add reaction");
  }

  return await res.json();
}

export async function removeReaction({
  message_id,
  emoji,
}: {
  message_id: string;
  emoji: string;
}) {
  const res = await fetch(`${getPublicApiUrl()}/messages/reactions`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      message_id,
      user_id: TEMP_USR,
      emoji,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to remove reaction");
  }

  return await res.json();
}
