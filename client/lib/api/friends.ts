import "client-only";

import { getPublicApiUrl } from "@/lib/env";
import { apiFetcher } from "@/lib/fetcher"
import { getToken } from "@clerk/nextjs";

type FriendRequestStatus = "pending" | "accepted" | "rejected";

export type FriendRequest = {
  id: string;
  status: FriendRequestStatus;
  requester_user_id: string;
  requester_username: string;
  requester_avatar_url: string;
  addressee_user_id: string;
  addressee_username: string;
  addressee_avatar_url: string;
  created_at: string; // ISO 8601 timestamp
};

export async function getAllPendingRequest() {
  return apiFetcher<FriendRequest[]>("friends/pending")
}


export async function cancelFriendRequest(id: string) {
  const token = await getToken()
  const res = await fetch(`${getPublicApiUrl()}/friends/cancel`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      id,
    })
  })
  if (!res.ok) {
    throw new Error("Failed to delete friend request")
  }

  return await res.json()
}

export async function acceptFriendRequest(id: string) {
  const token = await getToken()
  const res = await fetch(`${getPublicApiUrl()}/friends/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      id,
    })
  })
  if (!res.ok) {
    throw new Error("Failed to accept friend request")
  }

  return await res.json()
}

export async function declineFriendRequest(id: string) {
  const token = await getToken()
  const res = await fetch(`${getPublicApiUrl()}/friends/decline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      id,
    })
  })
  if (!res.ok) {
    throw new Error("Failed to decline friend request")
  }

  return await res.json()
}
