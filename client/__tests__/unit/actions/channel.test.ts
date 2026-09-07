import { createChannel, updateChannel } from "@/lib/actions/channels";
import { createChannelSchema } from "@/lib/validations/channel";
import { auth } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
   auth: {
      protect: vi.fn(),
   },
}));

vi.mock("@/lib/validations/channel", () => ({
   createChannelSchema: {
      safeParse: vi.fn(),
      pick: vi.fn(),
   },
}));

vi.mock("next/cache", () => ({ updateTag: vi.fn() }));

describe("channel server action test", () => {
   it("should return unauthenticated if no user id", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue(null),
         userId: null,
      } as any);

      await expect(
         createChannel({
            categoryID: "123",
            name: "test",
            serverID: "server_id",
            type: "test",
         }),
      ).resolves.toMatchObject({
         message: "unauthenticated",
         success: false,
      });
   });

   it("should return invalid data on bad payload", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
         userId: "user_123",
      } as never);

      vi.mocked(createChannelSchema.safeParse).mockReturnValue({
         success: false,
         error: { issues: [{ message: "invalid" }] },
      } as never);

      await expect(
         createChannel({
            name: "test",
            type: "",
         }),
      ).resolves.toMatchObject({
         message: "invalid data",
         success: false,
      });
   });

   it("should failed create channel when fetch failed", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
         userId: "user_123",
      } as never);

      vi.mocked(createChannelSchema.safeParse).mockReturnValue({
         success: true,
         error: {},
      } as never);

      vi.spyOn(global, "fetch").mockRejectedValue(
         new Error("failed to create channel"),
      );

      await expect(
         createChannel({
            name: "test",
            type: "text",
            categoryID: null,
            serverID: "server_123",
         }),
      ).resolves.toMatchObject({
         message: "failed to create channel",
         success: false,
      });
   });

   it("should create channel when fetch success", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
         userId: "user_123",
      } as never);

      vi.mocked(createChannelSchema.safeParse).mockReturnValue({
         success: true,
         error: {},
         data: { name: "test", type: "text" },
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(
            JSON.stringify({
               message: "channel created",
               success: true,
            }),
         ),
      );

      await expect(
         createChannel({
            name: "test",
            type: "text",
            categoryID: null,
            serverID: "server_123",
         }),
      ).resolves.toMatchObject({
         message: "channel created",
         success: true,
      });

      expect(updateTag).toHaveBeenCalled();
   });

   it("should update channel when fetch success", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
         userId: "user_123",
      } as never);

      vi.mocked(createChannelSchema.pick).mockReturnValue({
         safeParse: vi.fn().mockReturnValue({
            success: true,
            data: { name: "updated", topic: "general chat" },
         }),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(
            JSON.stringify({
               message: "channel updated",
               success: true,
            }),
         ),
      );

      await expect(
         updateChannel({
            channelId: "chan_123",
            name: "updated",
            topic: "general chat",
            categoryId: null,
            serverId: "server_123",
         }),
      ).resolves.toMatchObject({
         message: "channel updated",
         success: true,
      });

      expect(updateTag).toHaveBeenCalledWith("channels");
   });
});
