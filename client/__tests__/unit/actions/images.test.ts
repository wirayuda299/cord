import { uploadImage } from "@/lib/actions/images";
import { auth } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
   auth: {
      protect: vi.fn(),
   },
}));

vi.mock("next/cache", () => ({
   updateTag: vi.fn(),
}));

describe("image upload test", () => {
   it("should return unauthorized on userId null", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue(null),
         userId: null,
      } as never);

      await expect(
         uploadImage(
            new File(
               [new Blob(["Hello world"], { type: "text/plain" })],
               "file.txt",
            ),
         ),
      ).resolves.toMatchObject({
         message: "unauthorized",
         success: false,
      });
   });

   it("should failed if no file attached", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
         userId: "user_123",
      } as never);

      await expect(uploadImage()).resolves.toMatchObject({
         message: "no file attached",
         success: false,
      });
   });

   it("should failed on failed API call", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
         userId: "user_123",
      } as never);

      vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

      await expect(
         uploadImage(
            new File(
               [new Blob(["Hello world"], { type: "text/plain" })],
               "file.txt",
            ),
         ),
      ).resolves.toMatchObject({
         success: false,
         message: "Failed to upload image",
      });
   });

   it("should return url and id on success", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
         userId: "user_123",
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(
            JSON.stringify({
               message: "image uploaded",
               success: true,
               data: {
                  url: "https://cloudinary.com",
                  id: "image_id",
               },
            }),
         ),
      );

      await expect(
         uploadImage(
            new File(
               [new Blob(["Hello world"], { type: "text/plain" })],
               "file.txt",
            ),
         ),
      ).resolves.toMatchObject({
         data: {
            url: "https://cloudinary.com",
            id: "image_id",
         },
         message: "image uploaded",
         success: true,
      });

      expect(updateTag).toHaveBeenCalled();
   });
});
