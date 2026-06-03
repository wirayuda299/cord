"use server";

import { getPublicApiUrl } from "@/lib/env";
import { auth } from "@clerk/nextjs/server";

type UpdateServerProfileProps = {
  serverId: string;
  payload: {
    username?: string;
    avatar?: string;
    avatar_asset_id?: string;
    bio?: string;
  };
};

export async function updateServerProfile({
  serverId,
  payload,
}: UpdateServerProfileProps) {
  const { getToken } = await auth();
  const token = await getToken();
  const res = await fetch(`${getPublicApiUrl()}/server/profile/update`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ server_id: serverId, ...payload }),
  });

  if (!res.ok) {
    return { error: (await res.json()).message };
  }
  return { error: null };
}
