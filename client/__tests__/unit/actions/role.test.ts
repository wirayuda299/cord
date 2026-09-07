import { createRole, updateRole } from "@/lib/actions/role";
import { auth } from "@clerk/nextjs/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
   auth: {
      protect: vi.fn(),
   },
}));

describe("role actions test (smoke)", () => {
   it("should update role when fetch success", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ success: true })),
      );

      await expect(
         updateRole({
            role_id: "role_123",
            server_id: "server_123",
            name: "moderator",
         }),
      ).resolves.toMatchObject({
         message: "role updated",
         success: true,
      });
   });
});

describe("create role test", () => {
   const payload = {
      name: "moderator",
      server_id: "server_123",
      color: "#ff0000",
      icon: "shield",
      hoist: true,
      mentionable: true,
   };

   it("should return error message when API call failed", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(
            JSON.stringify({ message: "role name already exists" }),
            { status: 400 },
         ),
      );

      await expect(createRole(payload)).resolves.toMatchObject({
         message: "role name already exists",
         success: false,
      });
   });

   it("should fail when fetch rejects", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

      await expect(createRole(payload)).resolves.toMatchObject({
         message: "failed to create role",
         success: false,
      });
   });

   it("should create role when API call succeeds", async () => {
      vi.mocked(auth.protect).mockResolvedValue({
         getToken: vi.fn().mockResolvedValue("token"),
      } as never);

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ success: true, data: { id: "role_1" } })),
      );

      await expect(createRole(payload)).resolves.toMatchObject({
         message: "role created",
         success: true,
      });
   });
});
