import { isPublicRoute } from "@/proxy";
import type { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

// clerkMiddleware(fn) runs at module load time (`export default clerkMiddleware(...)`).
// Stub it to a passthrough so importing this module for isPublicRoute doesn't
// require real Clerk keys/config.
vi.mock("@clerk/nextjs/server", () => ({
   clerkMiddleware: (fn: unknown) => fn,
}));

function req(pathname: string): NextRequest {
   return { nextUrl: { pathname } } as NextRequest;
}

describe("isPublicRoute", () => {
   it.each([
      ["/", true],
      ["/sign-in", true],
      ["/sign-in/factor-one", true],
      ["/sign-up", true],
      ["/sign-up/continue", true],
      ["/api/webhook", true],
      ["/api/webhook/clerk", true],
      ["/dashboard", false],
      ["/servers/123", false],
      ["/api/get-participant-token", false],
      ["/sign-in-not-really", true], // startsWith match — documents current (loose) behavior
   ])("%s -> public=%s", (pathname, expected) => {
      expect(isPublicRoute(req(pathname))).toBe(expected);
   });
});
