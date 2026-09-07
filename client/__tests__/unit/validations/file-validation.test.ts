import { validateFiles } from "@/lib/file-validation";
import { describe, expect, it } from "vitest";

describe("file validation test", () => {
   it("should return max file provided more than should be", () => {
      const img = new File(["fake-image-content"], "photo.png", {
         type: "image/png",
      });

      const res = validateFiles([img], 1);
      expect(res.valid).toEqual([]);
      expect(res.errors).toEqual(["Only 1 file can be attached at a time"]);
   });

   it("rejects wrong file type", () => {
      const file = new File(["hello"], "doc.pdf", { type: "application/pdf" });
      const result = validateFiles([file], 0);
      expect(result.valid).toEqual([]);
      expect(result.errors).toEqual([
         "doc.pdf: only jpg, png, gif, webp allowed",
      ]);
   });

   it("rejects oversized file", () => {
      const file = new File([new Uint8Array(2 * 1024 * 1024)], "big.png", {
         type: "image/png",
      });
      const result = validateFiles([file], 0);
      expect(result.valid).toEqual([]);
      expect(result.errors).toEqual(["big.png: exceeds 1 MB limit"]);
   });

   it("accepts a valid image", () => {
      const file = new File(["content"], "photo.png", { type: "image/png" });
      const result = validateFiles([file], 0);
      expect(result.valid).toEqual([file]);
      expect(result.errors).toEqual([]);
   });
});
