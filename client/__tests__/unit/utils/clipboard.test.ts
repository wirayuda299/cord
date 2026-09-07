import { copyText } from "@/lib/clipboard";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("clipboard test", () => {
   // Each test sets navigator.clipboard itself instead of sharing a
   // beforeEach — a shared mock was masking the "not available" case
   // because beforeEach runs before every test regardless of where
   // it's declared in the file.
   afterEach(() => {
      Object.defineProperty(navigator, "clipboard", {
         configurable: true,
         value: undefined,
      });
   });

   it("returns false when navigator.clipboard is not available", async () => {
      Object.defineProperty(navigator, "clipboard", {
         configurable: true,
         value: undefined,
      });

      const res = await copyText("hello world");
      expect(res).toBe(false);
   });

   it("returns true and calls navigator.clipboard.writeText on success", async () => {
      Object.defineProperty(navigator, "clipboard", {
         configurable: true,
         value: {
            writeText: vi.fn(),
         },
      });
      const onSuccess = vi.fn();
      const onError = vi.fn();

      const result = await copyText("hello", {
         onSuccess,
         onError,
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello");
      expect(result).toBe(true);
   });
});
