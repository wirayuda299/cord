import { getPublicApiUrl } from "@/lib/env";

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
  const res = await fetch(`${getPublicApiUrl()}/friends/pending?user_id=usr_001`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  })
  if (!res.ok) {
    throw new Error("Failed to fetch pending request")
  }

  return await res.json().then(d => d.data as FriendRequest[])
}


export async function cancelFriendRequest(id: string) {
  const res = await fetch(`${getPublicApiUrl()}/friends/cancel`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      id,
      current_user_id: "usr_001"
    })
  })
  if (!res.ok) {
    throw new Error("Failed to delete friend request")
  }

  return await res.json()

}
