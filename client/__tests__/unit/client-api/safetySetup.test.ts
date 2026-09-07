import { getSafetySetup } from "@/lib/api/safety_rules";
import { getToken } from "@clerk/nextjs";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
   getToken: vi.fn(),
}));

describe("getSafetySetup", () => {
   it("returns { error: null, data } on success", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(
            JSON.stringify({ data: { nsfw: true, invite_disabled: false } }),
         ),
      );

      await expect(getSafetySetup("srv-1")).resolves.toEqual({
         error: null,
         data: { nsfw: true, invite_disabled: false },
      });
   });

   it("returns { error: message, data: null } when the request is not ok", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ message: "server not found" }), {
            status: 404,
         }),
      );

      await expect(getSafetySetup("srv-1")).resolves.toEqual({
         error: "server not found",
         data: null,
      });
   });

   it("propagates a network error instead of swallowing it", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

      await expect(getSafetySetup("srv-1")).rejects.toThrow("network error");
   });
});
