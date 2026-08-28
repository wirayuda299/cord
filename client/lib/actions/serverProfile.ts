"use server";

import { getPublicApiUrl } from "@/lib/env";
import { APIResponse } from "@/types/response";
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
}: UpdateServerProfileProps): Promise<APIResponse> {
  const { getToken } = await auth.protect();
  try {
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

    const json: APIResponse = await res.json()

    if (!res.ok) {
      return {
        message: json.message ?? "Failed to update server profile",
        success: false
      };
    }

    return {
      message: "server profile updated",
      success: true
    }
  } catch (e) {
    return {
      message: "Failed to update server profile",
      success: false
    };
  }
}
