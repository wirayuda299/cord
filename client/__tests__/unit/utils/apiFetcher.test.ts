import { apiFetcher } from "@/lib/fetcher";
import { getToken } from "@clerk/nextjs";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
   getToken: vi.fn(),
}));

describe("api fetcher utils test", () => {
   it("should throw error on fetch failed", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));
      await expect(apiFetcher("/users")).rejects.toThrow("network error");
   });

   it("should return data on success", async () => {
      vi.mocked(getToken).mockResolvedValue("token");

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(
            JSON.stringify({
               success: true,
               data: { id: 1 },
            }),
         ),
      );

      await expect(apiFetcher("/users")).resolves.toMatchObject({
         id: 1,
      });
   });
});
