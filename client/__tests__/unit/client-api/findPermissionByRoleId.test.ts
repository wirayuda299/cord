import { findPermissionByRoleId } from "@/lib/api/permissions";
import { apiFetcher } from "@/lib/fetcher";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/fetcher", () => ({
   apiFetcher: vi.fn(),
}));

describe("findPermissionByRoleId", () => {
   it("calls apiFetcher with the role_id query param and returns the first result", async () => {
      const permission = {
         id: "p1",
         role_id: "r1",
         permissions: ["read", "write"],
         created_at: "2026-01-01",
         updated_at: "2026-01-01",
      };
      vi.mocked(apiFetcher).mockResolvedValue([permission]);

      const result = await findPermissionByRoleId("r1");

      expect(apiFetcher).toHaveBeenCalledWith("permission/find?role_id=r1");
      expect(result).toEqual(permission);
   });

   it("returns null when apiFetcher resolves an empty array", async () => {
      vi.mocked(apiFetcher).mockResolvedValue([]);

      const result = await findPermissionByRoleId("r1");

      expect(result).toBeNull();
   });
});
