import "server-only";

import { getPublicApiUrl } from "@/lib/env";
import type { ServerListItem } from "@/lib/types/server";

export async function getAllServers(userId: string) {
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
}
