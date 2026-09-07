import { hasPermission } from "@/lib/queries/permissions";
import { auth } from "@clerk/nextjs/server";
import { describe, expect, it, vi } from "vitest";

// The real module throws when imported outside a Server Component; it's a
// pure marker with no runtime behavior to test, safe to stub out here.
vi.mock("server-only", () => ({}));

vi.mock("@clerk/nextjs/server", () => ({
   auth: vi.fn(),
}));

function mockAuth(token: string) {
   vi.mocked(auth).mockResolvedValue({
      getToken: vi.fn().mockResolvedValue(token),
   } as never);
}

describe("hasPermission (query)", () => {
   it("returns payload.data on success", async () => {
      mockAuth("token");

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ success: true, data: true })),
      );

      await expect(hasPermission("srv-1", "manage_roles")).resolves.toBe(true);
   });

   it("throws when !res.ok even if the body claims success", async () => {
      mockAuth("token");

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ success: true, data: true, message: "nope" }), {
            status: 500,
         }),
      );

      await expect(hasPermission("srv-1", "manage_roles")).rejects.toThrow(
         "nope",
      );
   });

   it("throws when payload.success is false even though res.ok is true", async () => {
      mockAuth("token");

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(
            JSON.stringify({ success: false, message: "permission denied" }),
         ),
      );

      await expect(hasPermission("srv-1", "manage_roles")).rejects.toThrow(
         "permission denied",
      );
   });

   it("falls back to a generic message when the response body isn't valid JSON", async () => {
      mockAuth("token");

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response("not json", { status: 500 }),
      );

      await expect(hasPermission("srv-1", "manage_roles")).rejects.toThrow(
         "Invalid response from server",
      );
   });
});
