import "server-only";

import { getPublicApiUrl } from "@/lib/env";
import type { BrowsableServer, ServerListItem } from "@/lib/types/server";

export async function getAllServers(userId: string) {
  try {
    const base = getPublicApiUrl();
    const response = await fetch(`${base}/server/find-all?user_id=${userId}`, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      next: {
        tags: ["servers"],
      },
    });
    const { data } = await response.json();
    return data as ServerListItem[];
  } catch (e) {
    throw e
  }
}

export async function browseServers(userId: string) {
  try {
    const base = getPublicApiUrl();
    const response = await fetch(`${base}/server/browse?user_id=${userId}`, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      next: { tags: ["servers"] },
    });
    const { data } = await response.json();
    return (data as BrowsableServer[]) ?? [];
  } catch {
    return [];
  }
}
