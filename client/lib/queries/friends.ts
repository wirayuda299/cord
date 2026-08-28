import 'server-only'

import { getPublicApiUrl } from "@/lib/env"
import { FriendListItem } from "@/types/friends";
import { auth } from '@clerk/nextjs/server';

export async function getAllFriends() {
  try {
    const { getToken } = await auth()
    const token = await getToken()

    const res = await fetch(`${getPublicApiUrl()}/friends`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
    })

    if (!res.ok) {
      throw new Error("Failed to fetch all friends")
    }

    const friends = await res.json()

    return friends.data as FriendListItem[]
  } catch (e) {
    throw e
  }
}
