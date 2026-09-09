import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";
import {
   acceptFriendRequest,
   cancelFriendRequest,
   declineFriendRequest,
   getAllPendingRequest,
   type FriendRequest,
} from "@/lib/api/friends";
import PendingRequests from "@/components/friends/PendingRequests";
import { toast } from "@/components/ui/toast";
import { afterEach, describe, expect, it, vi } from "vitest";

// RTL's auto-cleanup relies on a global `afterEach`, which this project's
// vitest config doesn't enable (no `test.globals: true`). Without this,
// each render() stays in the DOM into the next test, so e.g. "Accept"
// buttons from two tests both match the same getByTitle query.
afterEach(() => {
   cleanup();
});

// The component imports these directly, so mocking the module is required —
// only mocking getAllPendingRequest would leave the others `undefined`.
vi.mock("@/lib/api/friends", () => ({
   getAllPendingRequest: vi.fn(),
   acceptFriendRequest: vi.fn(),
   declineFriendRequest: vi.fn(),
   cancelFriendRequest: vi.fn(),
}));

// useRouter() throws outside a real Next.js router — the component only
// calls .refresh(), so that's the only method the fake needs.
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
   useRouter: () => ({ refresh: refreshMock }),
}));

// toast.add() belongs to @base-ui/react's toast manager, which expects a
// <ToastProvider> mounted somewhere. This test isn't about the toast UI,
// so it's mocked out rather than set up for real.
vi.mock("@/components/ui/toast", () => ({
   toast: { add: vi.fn() },
}));

function friendRequest(overrides: Partial<FriendRequest>): FriendRequest {
   return {
      id: "req-1",
      status: "pending",
      requester_user_id: "them",
      requester_username: "Them",
      requester_avatar_url: "",
      addressee_user_id: "me",
      addressee_username: "Me",
      addressee_avatar_url: "",
      created_at: "2026-01-01T00:00:00Z",
      ...overrides,
   };
}

// SWR caches by key ("/api/friends") in a module-level store by default, so
// without this, test 2's initial render could show test 1's leftover cached
// data instead of waiting for its own mock. A fresh Map per render keeps
// every test's SWR cache isolated from the others.
function renderIsolated(ui: ReactElement) {
   return render(
      <SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>,
   );
}

describe("PendingRequests (integration)", () => {
   it("splits requests into incoming vs outgoing based on currentUser", async () => {
      vi.mocked(getAllPendingRequest).mockResolvedValue([
         friendRequest({ id: "1", requester_user_id: "them", addressee_user_id: "me" }), // incoming
         friendRequest({ id: "2", requester_user_id: "me", addressee_user_id: "them" }), // outgoing
      ]);

      renderIsolated(<PendingRequests currentUser="me" />);

      // findByText = waitFor + getByText combined: waits for useSWR to
      // resolve, then asserts the text exists exactly once. If it's ever
      // missing, findByText's returned promise rejects and the test fails
      // with "Unable to find an element with the text: ..." — same
      // pass/fail signal as expect(x).toBe(y), just a different API shape.
      // (No jest-dom matcher like toBeInTheDocument is installed here.)
      await screen.findByText(/Incoming — 1/);
      await screen.findByText(/Outgoing — 1/);
   });

   it("shows the empty state when there are no pending requests", async () => {
      vi.mocked(getAllPendingRequest).mockResolvedValue([]);

      renderIsolated(<PendingRequests currentUser="me" />);

      await screen.findByText("All caught up!");
   });

   it("accepting an incoming request calls acceptFriendRequest, refetches, and refreshes the router", async () => {
      vi.mocked(getAllPendingRequest).mockResolvedValue([
         friendRequest({ id: "1", requester_user_id: "them", addressee_user_id: "me" }),
      ]);
      vi.mocked(acceptFriendRequest).mockResolvedValue({});

      renderIsolated(<PendingRequests currentUser="me" />);
      const acceptButton = await screen.findByTitle("Accept");

      fireEvent.click(acceptButton);

      await waitFor(() => {
         expect(acceptFriendRequest).toHaveBeenCalledWith("1");
      });
      // mutate() with no args re-invokes the same fetcher — proves the
      // component actually asked SWR to revalidate, not just called the API
      expect(getAllPendingRequest).toHaveBeenCalledTimes(2);
      expect(refreshMock).toHaveBeenCalled();
   });

   it("declining an incoming request calls declineFriendRequest and refetches (no router refresh)", async () => {
      vi.mocked(getAllPendingRequest).mockResolvedValue([
         friendRequest({ id: "1", requester_user_id: "them", addressee_user_id: "me" }),
      ]);
      vi.mocked(declineFriendRequest).mockResolvedValue({});

      renderIsolated(<PendingRequests currentUser="me" />);
      const declineButton = await screen.findByTitle("Decline");

      fireEvent.click(declineButton);

      await waitFor(() => {
         expect(declineFriendRequest).toHaveBeenCalledWith("1");
      });
      expect(getAllPendingRequest).toHaveBeenCalledTimes(2);
      expect(refreshMock).not.toHaveBeenCalled();
   });

   it("cancelling an outgoing request calls cancelFriendRequest and refetches", async () => {
      vi.mocked(getAllPendingRequest).mockResolvedValue([
         friendRequest({ id: "1", requester_user_id: "me", addressee_user_id: "them" }),
      ]);
      vi.mocked(cancelFriendRequest).mockResolvedValue({});

      renderIsolated(<PendingRequests currentUser="me" />);
      const cancelButton = await screen.findByTitle("Cancel");

      fireEvent.click(cancelButton);

      await waitFor(() => {
         expect(cancelFriendRequest).toHaveBeenCalledWith("1");
      });
      expect(getAllPendingRequest).toHaveBeenCalledTimes(2);
   });

   it("shows an error toast and does not refetch when accept fails", async () => {
      vi.mocked(getAllPendingRequest).mockResolvedValue([
         friendRequest({ id: "1", requester_user_id: "them", addressee_user_id: "me" }),
      ]);
      vi.mocked(acceptFriendRequest).mockRejectedValue(new Error("already accepted"));

      renderIsolated(<PendingRequests currentUser="me" />);
      const acceptButton = await screen.findByTitle("Accept");

      fireEvent.click(acceptButton);

      await waitFor(() => {
         expect(toast.add).toHaveBeenCalledWith({
            title: "already accepted",
            type: "error",
         });
      });
      // the .then(mutate) never runs when the promise rejects before it
      expect(getAllPendingRequest).toHaveBeenCalledTimes(1);
      expect(refreshMock).not.toHaveBeenCalled();
   });
});
