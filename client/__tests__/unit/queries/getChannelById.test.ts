import { getChannelById } from "@/lib/queries/channel_detail";
import { auth } from "@clerk/nextjs/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
   auth: vi.fn(),
}));

function mockAuth(userId: string | null, token = "token") {
   vi.mocked(auth).mockResolvedValue({
      userId,
      getToken: vi.fn().mockResolvedValue(token),
   } as never);
}

// getChannelById is wrapped in React's cache(), which memoizes per argument
// for the lifetime of this test module (no real per-request reset like in
// Next.js). Each test below uses its own unique channel id so it can't
// accidentally read back another test's cached result.
describe("getChannelById", () => {
   it("throws 'unauthenticated' when there is no userId", async () => {
      mockAuth(null);

      await expect(getChannelById("chan-unauth")).rejects.toThrow(
         "unauthenticated",
      );
   });

   it("returns { error } (does not throw) when the request is not ok", async () => {
      mockAuth("user_1");

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(null, { status: 404 }),
      );

      await expect(getChannelById("chan-notfound")).resolves.toEqual({
         error: "Failed to fetch channel",
      });
   });

   it("returns the channel data on success", async () => {
      mockAuth("user_1");

      const channel = { id: "chan-ok", name: "general", server_id: "srv-1" };
      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ data: channel })),
      );

      await expect(getChannelById("chan-ok")).resolves.toEqual(channel);
   });

   it("propagates a network error instead of swallowing it", async () => {
      mockAuth("user_1");

      vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

      await expect(getChannelById("chan-neterr")).rejects.toThrow(
         "network error",
      );
   });
});
