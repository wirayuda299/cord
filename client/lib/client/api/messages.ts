import { getPublicApiUrl } from "@/lib/env";
import { getToken } from "@clerk/nextjs";

export async function editMessage({
  id,
  content,
  channel_id,
  server_id
}: {
  id: string;
  content: string;
  channel_id: string;
  server_id: string
}) {
  const token = await getToken()

  const res = await fetch(`${getPublicApiUrl()}/messages`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      id,
      content,
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
  const token = await getToken()
  const res = await fetch(`${getPublicApiUrl()}/messages/reactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      message_id,
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
  const token = await getToken()
  const res = await fetch(`${getPublicApiUrl()}/messages/reactions`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      message_id,
      emoji,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to remove reaction");
  }

  return await res.json();
}
