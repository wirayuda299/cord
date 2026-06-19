import { getPublicApiUrl } from "@/lib/env";
import { User } from "@/lib/types/user";
import { getToken } from "@clerk/nextjs";

export type Friend = User & { friend_status: string };

export async function findUsersByName(username: string) {
   try {
      if (!username) {
         throw new Error("Username is required");
      }
      const token = await getToken();
      const res = await fetch(
         `${getPublicApiUrl()}/users/find-by-name?username=${username}`,
         {
            method: "GET",
            headers: {
               "Content-Type": "application/json",
               Accept: "application/json",
               Authorization: `Bearer ${token}`,
            },
         },
      );

      if (!res.ok) {
         throw Error("Failed to fetch users");
      }

      const users = await res.json();
      return users.data as Friend[];
   } catch (e) {
      throw e;
   }
}
