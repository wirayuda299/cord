import { createCategory } from "@/lib/actions/categories";
import { auth } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
   auth: {
      protect: vi.fn(),
   },
}));

vi.mock("next/cache", () => ({ updateTag: vi.fn() }));

describe("categories test", async () => {
   it("expect return invalid payload", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      await expect(
         createCategory({
            name: "boost",
         }),
      ).resolves.toMatchObject({ message: "invalid payload", success: false });

      expect(updateTag).not.toHaveBeenCalled();
   });

   it("expect return invalid payload when missmatch type", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      await expect(
         createCategory({
            name: "boost",
            server_id: 1222,
         }),
      ).resolves.toMatchObject({ message: "invalid payload", success: false });

      expect(updateTag).not.toHaveBeenCalled();
   });

   it("should call API when token is not null", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(
            JSON.stringify({
               message: "category created",
               success: true,
            }),
         ),
      );

      await expect(
         createCategory({
            name: "boost",
            server_id: "123",
         }),
      ).resolves.toMatchObject({ message: "category created", success: true });

      expect(updateTag).toHaveBeenCalled();
   });

   it("should return unauthorized when token is null", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue(null),
      } as any);

      await expect(
         createCategory({
            name: "boost",
            server_id: "123",
         }),
      ).resolves.toMatchObject({ message: "unauthorized", success: false });
   });

   it("should return network error when fetch failed", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as any);

      vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

      await expect(
         createCategory({
            name: "boost",
            server_id: "123",
         }),
      ).resolves.toMatchObject({
         message: "failed to create category",
         success: false,
      });

      expect(updateTag).not.toHaveBeenCalled();
   });
});
