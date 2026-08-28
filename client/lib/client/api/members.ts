import { getPublicApiUrl } from "@/lib/env";
import { apiFetcher } from "@/lib/utils";
import { getToken } from "@clerk/nextjs";

export type Member = {
   id: string;
   user_id: string;
   username: string;
   avatar_url: string;
   avatar_id: string;
   joined_at: string; // ISO date string
   role: string | null;
   role_id: string | null;
   role_color: string | null;
   server_id: string;
   is_banned?: boolean;
};
export async function getAllMembers(serverID: string): Promise<Member[]> {
   return apiFetcher<Member[]>(`members/find-all?serverID=${serverID}`);
}

export async function kickMember(member_id: string, server_id: string) {
   try {
      const res = await fetch(`${getPublicApiUrl()}/members/kick`, {
         method: "DELETE",
         headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${await getToken()}`,
         },
         body: JSON.stringify({
            member_id,
            server_id,
         }),
      });

      if (!res.ok) {
         throw new Error("failed to kick member");
      }

      return await res.json();
   } catch (e) {
      throw e;
   }
}

export async function banMember(member_id: string, server_id: string, reason: string = "") {
   try {
      const res = await fetch(`${getPublicApiUrl()}/server/bans`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${await getToken()}`,
         },
         body: JSON.stringify({
            member_id,
            server_id,
            reason,
         }),
      });

      if (!res.ok) {
         const data = await res.json().catch(() => ({}));
         throw new Error(data.error || "failed to ban member");
      }

      return await res.json();
   } catch (e) {
      throw e;
   }
}

export async function isUserBanned(server_id: string): Promise<boolean> {
   try {
      const res = await fetch(`${getPublicApiUrl()}/members/is-banned?server_id=${server_id}`, {
         method: "GET",
         headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${await getToken()}`,
         },
      });

      if (!res.ok) {
         throw new Error("failed to check ban status");
      }

      return await res.json().then(d => d.data);
   } catch (e) {
      throw e;
   }
}

