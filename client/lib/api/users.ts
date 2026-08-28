import "client-only";

import { User } from "@/types/user";
import { apiFetcher } from "@/lib/fetcher"

export type Friend = User & { friend_status: string };

export async function findUsersByName(username: string) {
   if (!username) {
      throw new Error("Username is required");
   }
   return apiFetcher<Friend[]>(`users/find-by-name?username=${username}`);
}
