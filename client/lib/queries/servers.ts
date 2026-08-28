import "server-only";

import { getPublicApiUrl } from "@/lib/env";
import type { BrowsableServer, ServerListItem } from "@/types/server";
import { auth } from "@clerk/nextjs/server";

export async function getAllServers() {
  try {

    const { getToken } = await auth()
    const token = await getToken()

    const response = await fetch(`${getPublicApiUrl()}/server/find-all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
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

export async function browseServers() {
  try {
    const { getToken } = await auth()
    const token = await getToken()

    const response = await fetch(`${getPublicApiUrl()}/server/browse`, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        "Authorization": `Bearer ${token}`
      },
      next: { tags: ["servers"] },
    });
    const { data } = await response.json();
    return (data as BrowsableServer[]) ?? [];
  } catch (e) {
    throw e
  }
}
