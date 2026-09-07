import { deleteImage } from "@/lib/actions/images";
import { auth } from "@clerk/nextjs/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
   auth: {
      protect: vi.fn(),
   },
}));

describe("image actions test (smoke)", () => {
   it("should delete image when fetch success", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ success: true })),
      );

      await expect(deleteImage("public_id_123")).resolves.toMatchObject({
         message: "image deleted",
         success: true,
      });
   });
});
