import { getAuditLogs } from "@/lib/actions/audit";
import { getToken } from "@clerk/nextjs";
import { describe, expect, it, vi } from "vitest";

//mock getToken from clerk
vi.mock("@clerk/nextjs", () => ({
   getToken: vi.fn(),
}));

describe("fetch audit log", () => {
   it("return proper error message if network error", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

      await expect(getAuditLogs("123")).resolves.toMatchObject({
         message: "network error",
         success: false,
      });
   });

   it("return early when server id not being provided", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      await expect(getAuditLogs("")).resolves.toMatchObject({
         message: "server id is required",
         success: false,
      });
   });

   it("return unauthorized when token null", async () => {
      vi.mocked(getToken).mockResolvedValue(null);

      await expect(getAuditLogs("123")).resolves.toMatchObject({
         message: "unauthorized",
         success: false,
      });
   });

   it("if getToken not null should call API", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      const data = [
         {
            id: "uuid_132233",
            actor_id: "user_13221",
            actor_username: "john",
            action_type: "create_server",
            target: "server",
            changes: [
               {
                  field: "file",
                  before: "",
                  after: "url...",
               },
            ],
            created_at: "29/09/2000",
         },
      ];
      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(
            JSON.stringify({
               data: data,
            }),
         ),
      );

      await expect(getAuditLogs("123")).resolves.toMatchObject({
         message: "log fetched",
         data: data,
      });
   });
});
