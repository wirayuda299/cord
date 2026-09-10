// components/members/MemberList.tsx
//
// Why: conditional SWR key (isOpen ? "/api/members" : null), online-count
// computation, owner-role-badge suppression.

import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";
import MemberList from "@/components/members/MemberList";
import { apiFetcher } from "@/lib/fetcher";
import type { Member } from "@/types/server";

afterEach(() => {
   cleanup();
});

vi.mock("@/lib/fetcher", () => ({
   apiFetcher: vi.fn(),
}));

// @base-ui/react's ScrollArea observes element size and queries running
// animations on scroll — neither API exists in jsdom, so both need a stub
// or mounting throws / leaves an unhandled rejection.
class ResizeObserverStub {
   observe() {}
   unobserve() {}
   disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);
if (!Element.prototype.getAnimations) {
   Element.prototype.getAnimations = () => [];
}

// Same isolation concern as PendingRequests.test.tsx: SWR caches by key
// module-globally by default, so each test needs its own cache.
function renderIsolated(ui: ReactElement) {
   return render(<SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>);
}

function member(overrides: Partial<Member>): Member {
   return {
      id: "m-1",
      user_id: "user-1",
      username: "alice",
      avatar_url: "",
      avatar_id: "",
      joined_at: "2026-01-01T00:00:00Z",
      role: null,
      role_id: null,
      role_color: null,
      server_id: "srv-1",
      ...overrides,
   };
}

describe("MemberList", () => {
   it("when isOpen=false, the SWR key is null — apiFetcher is never called", async () => {
      renderIsolated(
         <MemberList
            isOpen={false}
            serverId="srv-1"
            serverOwner="owner-1"
            setIsMemberOpen={vi.fn()}
         />,
      );

      await act(async () => {
         await Promise.resolve();
      });

      expect(apiFetcher).not.toHaveBeenCalled();
   });

   it('error -> "Failed to load members"', async () => {
      vi.mocked(apiFetcher).mockRejectedValue(new Error("network error"));

      renderIsolated(
         <MemberList
            isOpen={true}
            serverId="srv-1"
            serverOwner="owner-1"
            setIsMemberOpen={vi.fn()}
         />,
      );

      await screen.findByText("Failed to load members");
   });

   it("isLoading -> spinner", () => {
      // never resolves during this test — component stays in the loading state
      vi.mocked(apiFetcher).mockReturnValue(new Promise(() => {}));

      const { container } = renderIsolated(
         <MemberList
            isOpen={true}
            serverId="srv-1"
            serverOwner="owner-1"
            setIsMemberOpen={vi.fn()}
         />,
      );

      expect(container.querySelector(".animate-spin")).not.toBeNull();
      expect(screen.queryByText(/Online/)).toBeNull();
   });

   it("success -> member rows", async () => {
      vi.mocked(apiFetcher).mockResolvedValue([
         member({ id: "m1", user_id: "u1", username: "Alice" }),
         member({ id: "m2", user_id: "u2", username: "Bob" }),
      ]);

      renderIsolated(
         <MemberList
            isOpen={true}
            serverId="srv-1"
            serverOwner="owner-1"
            setIsMemberOpen={vi.fn()}
         />,
      );

      await screen.findByText("Alice");
      expect(screen.getByText("Bob")).not.toBeNull();
   });

   it('"Online — N" label count only counts members whose user_id is in onlineIds', async () => {
      vi.mocked(apiFetcher).mockResolvedValue([
         member({ id: "m1", user_id: "u1", username: "Alice" }),
         member({ id: "m2", user_id: "u2", username: "Bob" }),
         member({ id: "m3", user_id: "u3", username: "Carol" }),
      ]);

      renderIsolated(
         <MemberList
            isOpen={true}
            serverId="srv-1"
            serverOwner="owner-1"
            onlineIds={new Set(["u1", "u3", "not-a-member"])}
            setIsMemberOpen={vi.fn()}
         />,
      );

      await screen.findByText("Online — 2");
   });

   it("a member's role label is suppressed when isOwner is true, even if member.role is set", async () => {
      vi.mocked(apiFetcher).mockResolvedValue([
         member({ id: "m1", user_id: "owner-1", username: "Alice", role: "admin" }),
         member({ id: "m2", user_id: "u2", username: "Bob", role: "moderator" }),
      ]);

      renderIsolated(
         <MemberList
            isOpen={true}
            serverId="srv-1"
            serverOwner="owner-1"
            setIsMemberOpen={vi.fn()}
         />,
      );

      await screen.findByText("Alice");
      // owner: role label suppressed
      expect(screen.queryByText("Admin")).toBeNull();
      // non-owner: role label shown
      expect(screen.getByText("Moderator")).not.toBeNull();
   });
});
