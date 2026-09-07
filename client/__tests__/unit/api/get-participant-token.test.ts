import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const toJwtMock = vi.hoisted(() => vi.fn().mockResolvedValue("fake.jwt.token"));
const addGrantMock = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({
   auth: vi.fn(),
}));

vi.mock("livekit-server-sdk", () => ({
   // arrow functions can't be called with `new`, so this needs a real function
   AccessToken: vi.fn().mockImplementation(function (this: unknown) {
      Object.assign(this as object, {
         addGrant: addGrantMock,
         toJwt: toJwtMock,
      });
   }),
}));

import { GET } from "@/app/api/get-participant-token/route";

const ORIGINAL_ENV = {
   LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
   LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
   NEXT_PUBLIC_LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL,
};

function mockAuth(userId: string | null, token = "token") {
   vi.mocked(auth).mockResolvedValue({
      userId,
      getToken: vi.fn().mockResolvedValue(token),
   } as never);
}

function makeReq(params: Record<string, string>) {
   const url = new URL("http://localhost/api/get-participant-token");
   for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
   return new NextRequest(url);
}

beforeEach(() => {
   process.env.LIVEKIT_API_KEY = "key";
   process.env.LIVEKIT_API_SECRET = "secret";
   process.env.NEXT_PUBLIC_LIVEKIT_URL = "wss://livekit.test";
});

afterEach(() => {
   process.env.LIVEKIT_API_KEY = ORIGINAL_ENV.LIVEKIT_API_KEY;
   process.env.LIVEKIT_API_SECRET = ORIGINAL_ENV.LIVEKIT_API_SECRET;
   process.env.NEXT_PUBLIC_LIVEKIT_URL = ORIGINAL_ENV.NEXT_PUBLIC_LIVEKIT_URL;
});

describe("GET /api/get-participant-token", () => {
   it("returns 401 when there is no userId", async () => {
      mockAuth(null);

      const res = await GET(makeReq({ room: "r1", username: "u1", serverId: "s1" }));

      expect(res.status).toBe(401);
      await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
   });

   it("returns 400 when 'room' is missing", async () => {
      mockAuth("user_1");

      const res = await GET(makeReq({ username: "u1", serverId: "s1" }));

      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({
         error: 'Missing "room" query parameter',
      });
   });

   it("returns 400 when 'username' is missing", async () => {
      mockAuth("user_1");

      const res = await GET(makeReq({ room: "r1", serverId: "s1" }));

      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({
         error: 'Missing "username" query parameter',
      });
   });

   it("returns 400 when 'serverId' is missing", async () => {
      mockAuth("user_1");

      const res = await GET(makeReq({ room: "r1", username: "u1" }));

      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({
         error: 'Missing "serverId" query parameter',
      });
   });

   it("returns 403 when the membership check response is not ok", async () => {
      mockAuth("user_1");
      vi.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 404 }));

      const res = await GET(makeReq({ room: "r1", username: "u1", serverId: "s1" }));

      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
   });

   it("returns 403 when the channel belongs to a different server", async () => {
      mockAuth("user_1");
      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ data: { server_id: "other-server" } })),
      );

      const res = await GET(makeReq({ room: "r1", username: "u1", serverId: "s1" }));

      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
   });

   it("returns 403 when the membership fetch throws", async () => {
      mockAuth("user_1");
      vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

      const res = await GET(makeReq({ room: "r1", username: "u1", serverId: "s1" }));

      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
   });

   it("returns 500 when LiveKit env vars are missing", async () => {
      mockAuth("user_1");
      delete process.env.LIVEKIT_API_KEY;
      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ data: { server_id: "s1" } })),
      );

      const res = await GET(makeReq({ room: "r1", username: "u1", serverId: "s1" }));

      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({ error: "Server misconfigured" });
   });

   it("issues a token when the caller is a member of the matching server", async () => {
      mockAuth("user_1");
      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ data: { server_id: "s1" } })),
      );

      const res = await GET(makeReq({ room: "r1", username: "u1", serverId: "s1" }));

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ token: "fake.jwt.token" });
      expect(addGrantMock).toHaveBeenCalledWith({
         room: "r1",
         roomJoin: true,
         canPublish: true,
         canSubscribe: true,
      });
   });

   it("issues a token when the channel has no server_id on record (nothing to compare)", async () => {
      mockAuth("user_1");
      vi.spyOn(global, "fetch").mockResolvedValue(
         new Response(JSON.stringify({ data: {} })),
      );

      const res = await GET(makeReq({ room: "r1", username: "u1", serverId: "s1" }));

      expect(res.status).toBe(200);
   });
});
