import { getToken } from "@clerk/nextjs";
import { getPublicApiUrl } from "../env";

export async function getAuditLogs(serverId: string) {
   const token = await getToken();

   if (!token) return { message: "unauthorized", success: false };
   if (!serverId) return { message: "server id is required", success: false };

   try {
      const res = await fetch(
         `${getPublicApiUrl()}/server/audit-logs?serverID=${serverId}`,
         {
            method: "GET",
            headers: {
               Accept: "application/json",
               Authorization: `Bearer ${token}`,
            },
         },
      );

      if (!res.ok) {
         return {
            message: (await res.json()).message ?? "failed to fetch log",
            success: false,
         };
      }

      const result = await res.json();
      return { message: "log fetched", success: true, data: result.data };
   } catch (e) {
      return {
         message: (e as Error).message ?? "failed to fetch log",
         success: false,
      };
   }
}
