import { assignRole } from "@/lib/api/roles";
import { getToken } from "@clerk/nextjs";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
   getToken: vi.fn(),
}));

describe("assign role", () => {
   it("should return undefined on success", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      vi.spyOn(global, "fetch").mockResolvedValue(new Response(undefined));

      await expect(
         assignRole("mem-1", "srv-1", "default"),
      ).resolves.toBeUndefined();
   });

   it("should throw error on fetch failed", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      vi.spyOn(global, "fetch").mockRejectedValue(
         new Error("failed to assign role"),
      );

      await expect(assignRole("mem-1", "srv-1", "default")).rejects.toThrow(
         new Error("failed to assign role"),
      );
   });
});
