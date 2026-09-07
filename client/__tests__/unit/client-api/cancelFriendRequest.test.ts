import { cancelFriendRequest } from "@/lib/api/friends";
import { getToken } from "@clerk/nextjs";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
   getToken: vi.fn(),
}));

describe("cancel friend request", () => {
   it("should return the response body on success", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ success: true })),
      );

      await expect(cancelFriendRequest("req-1")).resolves.toEqual({
         success: true,
      });
   });

   it("should throw when the request is not ok", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(null, { status: 400 }),
      );

      await expect(cancelFriendRequest("req-1")).rejects.toThrow(
         "Failed to delete friend request",
      );
   });

   it("should propagate a network error", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

      await expect(cancelFriendRequest("req-1")).rejects.toThrow(
         "network error",
      );
   });
});
