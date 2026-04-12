"use server";

import { getPublicApiUrl } from "@/lib/env";
import { updateTag } from "next/cache";

export async function createServer(name: string, ownerId: string) {
  if (name === "") {
    return { error: "Server name is required" };
  }

  const base = getPublicApiUrl();
  const res = await fetch(`${base}/server/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      owner_id: ownerId,
    }),
  });

  if (!res.ok) {
    return {
      error: (await res.json()).message,
    };
  }
  updateTag("servers");
  return { error: null };
}
