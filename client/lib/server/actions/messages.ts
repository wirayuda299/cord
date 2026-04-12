"use server";

import { getPublicApiUrl } from "@/lib/env";
import { revalidatePath, updateTag } from "next/cache";

export async function pinMessage(pinned_by: string, msg_id: string, channel_id: string) {
  try {
    const base = getPublicApiUrl();
    const response = await fetch(`${base}/messages/pin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        pinned_by,
        msg_id,
        channel_id,
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

export async function deletePinnedMessage(id: string) {
  try {
    const base = getPublicApiUrl();
    const res = await fetch(`${base}/messages/pin`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(id),
    });

    if (res.ok) {
      updateTag("pinnedMessages");
      return await res.json();
    }
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const res = await fetch(`${base}/messages`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
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
    revalidatePath(path);
  } catch (e) {
    throw e;
  }
}
