"use server";

import { getPublicApiUrl } from "@/lib/env";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";


export async function startConversation(formData: FormData): Promise<void> {
  const targetedUserId = String(formData.get("targeted_user_id") ?? "");

  if (!targetedUserId) {
    throw new Error("Target user id is missing");
  }

  const { getToken } = await auth()
  const token = await getToken()


  const res = await fetch(`${getPublicApiUrl()}/conversation/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      targeted_user_id: targetedUserId,
    }),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(payload?.message ?? "Failed to create conversation");
  }

  const channelId = payload?.data?.channel_id;
  if (!channelId) {
    throw new Error("Conversation response missing channel id");
  }

  redirect(`/direct-messages/${channelId}`);
}
