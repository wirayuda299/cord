import "client-only";

import { apiFetcher } from "@/lib/fetcher"

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
