import { findUsersByName } from "@/lib/api/users";
import { apiFetcher } from "@/lib/fetcher";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/fetcher", () => ({
   apiFetcher: vi.fn(),
}));

const data = {
   id: "usr_001",
   name: "John Doe",
   bio: "Fullstack developer who likes building things.",
   avatar_url: "https://example.com/avatars/john.jpg",
   avatar_id: "avatar_001",
   created_at: "2026-09-01T10:00:00Z",
   updated_at: "2026-09-05T14:30:00Z",
   friend_status: "accepted",
};
describe("user test", () => {
   it("should return friend list on success", async () => {
      vi.mocked(apiFetcher).mockResolvedValue([data]);
      await expect(findUsersByName("john")).resolves.toEqual([data]);
   });

   it("should throw error on invalid args", async () => {
      await expect(findUsersByName("")).rejects.toThrow(
         new Error("Username is required"),
      );
   });
});
