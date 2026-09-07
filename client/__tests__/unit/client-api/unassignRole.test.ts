import { unassignRole } from "@/lib/api/roles";
import { getToken } from "@clerk/nextjs";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
   getToken: vi.fn(),
}));

describe("unassign role", () => {
   it("should return undefined on success", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      vi.spyOn(global, "fetch").mockResolvedValue(new Response(undefined));

      await expect(
         unassignRole("mem-1", "srv-1", "default"),
      ).resolves.toBeUndefined();
   });

   it("should throw error on fetch failed", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      vi.spyOn(global, "fetch").mockRejectedValue(
         new Error("failed to unassign role"),
      );

      await expect(unassignRole("mem-1", "srv-1", "default")).rejects.toThrow(
         new Error("failed to unassign role"),
      );
   });
});
