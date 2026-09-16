import { getAllChannel, type GroupedChannels } from "@/lib/queries/channels";
import { auth } from "@clerk/nextjs/server";
import { describe, expect, it, vi } from "vitest";

// The real module throws when imported outside a Server Component; it's a
// pure marker with no runtime behavior to test, safe to stub out here.
vi.mock("server-only", () => ({}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

function mockAuth(userId: string | null, token = "token") {
  vi.mocked(auth).mockResolvedValue({
    userId,
    getToken: vi.fn().mockResolvedValue(token),
  } as never);
}

const sampleChannels: GroupedChannels = {
  server: { id: "srv-1", name: "My Server", created_by: "user_1" },
  uncategorized: [],
  categories: [],
};

describe("getAllChannel", () => {
  it("returns the grouped channels object on success", async () => {
    mockAuth("user_1");
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleChannels })),
    );

    await expect(getAllChannel("srv-1")).resolves.toEqual(sampleChannels);
  });

  // Regression test: this used to return `[] as unknown as
  // Promise<GroupedChannels>` — an empty array mis-cast as the object shape
  // callers expect — which made `channels.server` silently `undefined`
  // instead of the failure being visible, crashing any caller (e.g.
  // ServerSidebar) that didn't happen to guard against it.
  it("returns null (not a malformed object) when unauthenticated", async () => {
    mockAuth(null);

    const result = await getAllChannel("srv-1");

    expect(result).toBeNull();
  });

  it("returns null (not a malformed object) on a network error", async () => {
    mockAuth("user_1");
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

    const result = await getAllChannel("srv-1");

    expect(result).toBeNull();
  });
});
