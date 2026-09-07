import { editMessage } from "@/lib/api/messages";
import { getToken } from "@clerk/nextjs";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
   getToken: vi.fn(),
}));

describe("editMessage", () => {
   it("returns the updated message on success", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ id: "m1", content: "updated" })),
      );

      await expect(
         editMessage({ id: "m1", content: "updated", channel_id: "c1" }),
      ).resolves.toEqual({ id: "m1", content: "updated" });
   });

   it("throws the server's error message when the request is not ok", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ message: "message not found" }), {
            status: 404,
         }),
      );

      await expect(
         editMessage({ id: "missing", content: "x", channel_id: "c1" }),
      ).rejects.toThrow("message not found");
   });

   // Regression test: the error body isn't always valid JSON (e.g. an empty
   // 500 response). `.catch()` used to fall back to `null`, and reading
   // `data.message` on `null` crashed with a TypeError instead of the
   // intended "Failed to edit message" fallback.
   it("falls back to a generic error message when the error body isn't valid JSON", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response("not json", { status: 500 }),
      );

      await expect(
         editMessage({ id: "m1", content: "x", channel_id: "c1" }),
      ).rejects.toThrow("Failed to edit message");
   });

   it("propagates a network error", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

      await expect(
         editMessage({ id: "m1", content: "x", channel_id: "c1" }),
      ).rejects.toThrow("network error");
   });
});
