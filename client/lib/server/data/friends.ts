import 'server-only'

import { getPublicApiUrl } from "@/lib/env"
import { FriendListItem } from "@/lib/types/friends";

export async function getAllFriends(userId: string) {
   const res = await fetch(`${getPublicApiUrl()}/friends?user_id=${userId}`, {
      method: "GET",
      headers: {
         "Content-Type": "application/json",
      }
   })

   if (!res.ok) {
      throw new Error("Failed to fetch all friends")
   }

   const friends = await res.json()

   return friends.data as FriendListItem[]
}
