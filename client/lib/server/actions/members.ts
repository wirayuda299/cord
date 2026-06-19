"use server";

import { isUserJoin } from "@/lib/server/data/members";
import { getPublicApiUrl } from "@/lib/env";
import { auth } from "@clerk/nextjs/server";

export async function isMemberJoined(serverId: string): Promise<boolean> {
  return await isUserJoin(serverId);
}

export async function isMemberBanned(serverId: string): Promise<boolean> {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    const res = await fetch(`${getPublicApiUrl()}/members/is-banned?server_id=${serverId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!res.ok) {
      throw new Error("failed to check ban status");
    }

    return await res.json().then(d => d.data);
  } catch (e) {
    throw e;
  }
}
