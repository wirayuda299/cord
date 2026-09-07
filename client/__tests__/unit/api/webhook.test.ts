import { headers } from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const verifyMock = vi.hoisted(() => vi.fn());

vi.mock("svix", () => ({
   // arrow functions can't be called with `new`, so this needs a real function
   Webhook: vi.fn().mockImplementation(function () {
      return { verify: verifyMock };
   }),
}));

vi.mock("next/headers", () => ({
   headers: vi.fn(),
}));

import { POST } from "@/app/api/webhook/route";

const ORIGINAL_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
const ORIGINAL_API_URL = process.env.NEXT_PUBLIC_API_URL;

function mockHeaders(present: boolean) {
   vi.mocked(headers).mockResolvedValue(
      new Headers(
         present
            ? {
                 "svix-id": "id1",
                 "svix-timestamp": "ts1",
                 "svix-signature": "sig1",
              }
            : {},
      ) as never,
   );
}

function makeReq(body: unknown) {
   return new Request("http://localhost/api/webhook", {
      method: "POST",
      body: JSON.stringify(body),
   });
}

beforeEach(() => {
   process.env.CLERK_WEBHOOK_SIGNING_SECRET = "whsec_test";
   process.env.NEXT_PUBLIC_API_URL = "http://backend.test";
   mockHeaders(true);
});

afterEach(() => {
   process.env.CLERK_WEBHOOK_SIGNING_SECRET = ORIGINAL_SECRET;
   process.env.NEXT_PUBLIC_API_URL = ORIGINAL_API_URL;
});

describe("POST /api/webhook", () => {
   it("returns 500 when CLERK_WEBHOOK_SIGNING_SECRET is not set", async () => {
      delete process.env.CLERK_WEBHOOK_SIGNING_SECRET;

      const res = await POST(makeReq({}));

      expect(res.status).toBe(500);
      expect(await res.text()).toBe("Webhook secret not configured");
   });

   it("returns 400 when svix headers are missing", async () => {
      mockHeaders(false);

      const res = await POST(makeReq({}));

      expect(res.status).toBe(400);
      expect(await res.text()).toBe("Missing svix headers");
   });

   it("returns 400 when signature verification fails", async () => {
      verifyMock.mockImplementation(() => {
         throw new Error("bad signature");
      });

      const res = await POST(makeReq({}));

      expect(res.status).toBe(400);
      expect(await res.text()).toBe("Invalid signature");
   });

   it("returns 200 OK for an unhandled event type without calling the backend", async () => {
      verifyMock.mockReturnValue({ type: "user.updated", data: {} });
      const fetchSpy = vi.spyOn(global, "fetch");

      const res = await POST(makeReq({}));

      expect(res.status).toBe(200);
      expect(fetchSpy).not.toHaveBeenCalled();
   });

   it("forwards user.created to the backend and returns 201 on success", async () => {
      verifyMock.mockReturnValue({
         type: "user.created",
         data: {
            id: "usr_1",
            username: "john",
            image_url: "https://example.com/avatar.png",
            email_addresses: [{ verification: { status: "verified" } }],
         },
      });

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response("ok", { status: 200 }),
      );

      const res = await POST(makeReq({}));

      expect(res.status).toBe(201);
      await expect(res.json()).resolves.toEqual({ success: true, id: "usr_1" });
   });

   it("returns 500 when the backend rejects user creation", async () => {
      verifyMock.mockReturnValue({
         type: "user.created",
         data: { id: "usr_1", username: "john", email_addresses: [] },
      });

      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response("duplicate user", { status: 409 }),
      );

      const res = await POST(makeReq({}));

      expect(res.status).toBe(500);
      expect(await res.text()).toContain("duplicate user");
   });

   it("returns 500 when the backend fetch throws", async () => {
      verifyMock.mockReturnValue({
         type: "user.created",
         data: { id: "usr_1", username: "john", email_addresses: [] },
      });

      vi.spyOn(global, "fetch").mockRejectedValue(new Error("network down"));

      const res = await POST(makeReq({}));

      expect(res.status).toBe(500);
      expect(await res.text()).toBe("Failed to create user");
   });
});
