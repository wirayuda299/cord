import { createInvitationCode, joinServerByCode } from "@/lib/actions/invitations";
import { auth } from "@clerk/nextjs/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
   auth: {
      protect: vi.fn(),
   },
}));

describe("create invitation code test", () => {
   it("should return error when server id missing", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      await expect(createInvitationCode("")).resolves.toMatchObject({
         message: "Server ID is missing",
         success: false,
      });
   });

   it("should return error message when API call failed", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ message: "server not found" }), {
            status: 404,
         }),
      );

      await expect(createInvitationCode("server_123")).resolves.toMatchObject({
         message: "server not found",
         success: false,
      });
   });

   it("should fail when fetch rejects", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

      await expect(createInvitationCode("server_123")).resolves.toMatchObject({
         message: "failed to create invitation",
         success: false,
      });
   });

   it("should create invitation code when API call succeeds", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(
            JSON.stringify({
               success: true,
               data: { code: "abc123" },
            }),
         ),
      );

      await expect(createInvitationCode("server_123")).resolves.toMatchObject({
         data: { code: "abc123" },
         message: "invitation created",
         success: true,
      });
   });
});

describe("join server by code test", () => {
   it("should return error when code missing", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      await expect(joinServerByCode("")).resolves.toMatchObject({
         message: "Invitation code is missing",
         success: false,
      });
   });

   it("should return error message when API call failed", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ message: "invalid code" }), {
            status: 400,
         }),
      );

      await expect(joinServerByCode("bad_code")).resolves.toMatchObject({
         message: "invalid code",
         success: false,
      });
   });

   it("should fail when fetch rejects", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

      await expect(joinServerByCode("abc123")).resolves.toMatchObject({
         message: "failed to join server",
         success: false,
      });
   });

   it("should join server when API call succeeds", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ success: true })),
      );

      await expect(joinServerByCode("abc123")).resolves.toMatchObject({
         message: "successfully join a server",
         success: true,
      });
   });
});
