import { banMember, joinServer, updateServer } from "@/lib/actions/servers";
import { auth } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
   auth: {
      protect: vi.fn(),
   },
}));

vi.mock("next/cache", () => ({
   updateTag: vi.fn(),
}));

describe("update server actions test (smoke)", () => {
   it("should join server when API call succeeds", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ success: true })),
      );

      await expect(joinServer("server_123", "user_123")).resolves.toMatchObject(
         {
            message: "successfully join a server",
            success: true,
         },
      );

      expect(updateTag).toHaveBeenCalledWith("servers");
   });
});

describe("update server test", () => {
   it("should return unauthenticated when userId is null", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
         userId: null,
      } as never);

      await expect(
         updateServer({
            fields: { banner: true },
            serverId: "server_id",
            payload: {
               banner_colors: ["red"],
            },
         }),
      ).resolves.toMatchObject({ message: "unauthenticated", success: false });
   });

   it("should failed if no field added", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
         userId: "user_123",
      } as never);

      await expect(
         updateServer({
            fields: {},
            serverId: "server_id",
            payload: {
               banner_colors: ["red"],
            },
         }),
      ).resolves.toMatchObject({ success: false, message: "no changes" });
   });

   it("should failed if API call failed", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
         userId: "user_123",
      } as never);

      vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));
      await expect(
         updateServer({
            fields: { banner: true },
            serverId: "server_id",
            payload: {
               banner_colors: ["red"],
            },
         }),
      ).resolves.toMatchObject({
         success: false,
         message: "failed to update server",
      });
   });

   it("should success if API call ok", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
         userId: "user_123",
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(
            JSON.stringify({
               message: "server updated",
               success: true,
            }),
         ),
      );
      await expect(
         updateServer({
            fields: { banner: true },
            serverId: "server_id",
            payload: {
               banner_colors: ["red"],
            },
         }),
      ).resolves.toMatchObject({
         success: true,
         message: "server updated",
      });

      expect(updateTag).toHaveBeenCalledWith("servers");
   });
});

describe("ban member test", () => {
   it("should return error message when API call failed", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(
            JSON.stringify({ message: "member already banned" }),
            { status: 400 },
         ),
      );

      await expect(
         banMember("server_123", "member_123", "spam"),
      ).resolves.toMatchObject({
         message: "member already banned",
         success: false,
      });
   });

   it("should fail when fetch rejects", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

      await expect(
         banMember("server_123", "member_123", "spam"),
      ).resolves.toMatchObject({
         message: "failed to ban member",
         success: false,
      });
   });

   it("should ban member when API call succeeds", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ success: true })),
      );

      await expect(
         banMember("server_123", "member_123", "spam"),
      ).resolves.toMatchObject({ message: "member banned", success: true });

      expect(updateTag).toHaveBeenCalledWith("servers");
   });
});
