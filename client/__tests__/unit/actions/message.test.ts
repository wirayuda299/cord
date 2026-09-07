import {
   createThread,
   deleteMessage,
   deletePinnedMessage,
   pinMessage,
} from "@/lib/actions/messages";
import { auth } from "@clerk/nextjs/server";
import { refresh, updateTag } from "next/cache";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
   auth: {
      protect: vi.fn(),
   },
}));

vi.mock("next/cache", () => ({
   updateTag: vi.fn(),
   refresh: vi.fn(),
}));

describe("message actions test (smoke)", () => {
   it("should delete pinned message when fetch success", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ success: true })),
      );

      await expect(
         deletePinnedMessage("msg_123", "server_123"),
      ).resolves.toMatchObject({
         message: "message deleted",
         success: true,
      });

      expect(updateTag).toHaveBeenCalledWith("pinnedMessages");
   });

   it("should delete message when fetch success", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ success: true })),
      );

      await expect(
         deleteMessage({
            id: "msg_123",
            public_id: "public_123",
            channel_id: "chan_123",
            server_id: "server_123",
         }),
      ).resolves.toMatchObject({
         message: "message has been deleted",
         success: true,
      });
   });
});

describe("pin message test", () => {
   it("should return error message when API call failed", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(
            JSON.stringify({ message: "message already pinned" }),
            { status: 400 },
         ),
      );

      await expect(
         pinMessage("msg_123", "chan_123", "server_123"),
      ).resolves.toMatchObject({
         message: "message already pinned",
         success: false,
      });
   });

   it("should fail when fetch rejects", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

      await expect(
         pinMessage("msg_123", "chan_123", "server_123"),
      ).resolves.toMatchObject({
         message: "failed to pin message",
         success: false,
      });
   });

   it("should pin message when API call succeeds", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ success: true })),
      );

      await expect(
         pinMessage("msg_123", "chan_123", "server_123"),
      ).resolves.toMatchObject({
         message: "message pinned",
         success: true,
      });

      expect(updateTag).toHaveBeenCalledWith("pinnedMessages");
   });
});

describe("create thread test", () => {
   const params = {
      channel_id: "chan_123",
      name: "discussion",
      message_id: "msg_123",
      server_id: "server_123",
   };

   it("should return error message when API call failed", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ message: "thread already exists" }), {
            status: 400,
         }),
      );

      await expect(createThread(params)).resolves.toMatchObject({
         message: "thread already exists",
         success: false,
      });
   });

   it("should fail when fetch rejects", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

      await expect(createThread(params)).resolves.toMatchObject({
         message: "failed to create thread",
         success: false,
      });
   });

   it("should create thread when API call succeeds", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

      await expect(createThread(params)).resolves.toMatchObject({
         message: "thread created",
         success: true,
      });

      expect(updateTag).toHaveBeenCalledWith("messages");
      expect(refresh).toHaveBeenCalled();
   });
});
