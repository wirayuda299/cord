// components/friends/AddFriendPanel.tsx
//
// Why: debounced search with a 3-char minimum gate, SWR mutation with
// optimistic local update, per-row sending/disabled state machine.

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";
import AddFriendPanel from "@/components/friends/AddFriendPanel";
import { toast } from "@/components/ui/toast";
import { findUsersByName, type Friend } from "@/lib/api/users";
import { sendFriendRequest } from "@/lib/actions/friends";

afterEach(() => {
   cleanup();
   vi.useRealTimers();
});

vi.mock("@/lib/api/users", () => ({
   findUsersByName: vi.fn(),
}));

vi.mock("@/lib/actions/friends", () => ({
   sendFriendRequest: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
   toast: { add: vi.fn() },
}));

function friend(overrides: Partial<Friend>): Friend {
   return {
      id: "user-1",
      name: "bob",
      bio: "",
      avatar_url: "",
      avatar_id: "",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      friend_status: "",
      ...overrides,
   };
}

// SWR caches by key in a module-level store by default — a fresh Map per
// render keeps every test's cache isolated from the others.
function renderIsolated(ui: ReactElement) {
   return render(
      <SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>,
   );
}

function typeAndDebounce(value: string) {
   const input = screen.getByPlaceholderText("Enter a username...");
   fireEvent.change(input, { target: { value } });
   act(() => {
      vi.advanceTimersByTime(300);
   });
}

describe("AddFriendPanel", () => {
   it('typing under 3 characters shows the "must be at least 3 characters" hint and does NOT trigger findUsersByName', () => {
      vi.useFakeTimers();
      renderIsolated(<AddFriendPanel />);

      typeAndDebounce("ab");

      expect(
         screen.getByText("Username must be at least 3 characters."),
      ).not.toBeNull();
      expect(findUsersByName).not.toHaveBeenCalled();
   });

   it('typing 3+ characters (after debounce) calls findUsersByName, shows "Searching users..." while in flight, "No users found." when the result is empty', async () => {
      vi.useFakeTimers();
      let resolveSearch: (users: Friend[]) => void = () => {};
      vi.mocked(findUsersByName).mockImplementation(
         () =>
            new Promise((resolve) => {
               resolveSearch = resolve;
            }),
      );

      renderIsolated(<AddFriendPanel />);
      typeAndDebounce("bob");
      vi.useRealTimers();

      await waitFor(() => expect(findUsersByName).toHaveBeenCalledWith("bob"));
      expect(screen.getByText("Searching users...")).not.toBeNull();

      act(() => {
         resolveSearch([]);
      });

      await screen.findByText("No users found.");
      expect(screen.queryByText("Searching users...")).toBeNull();
   });

   it('clicking "Send request" on a user with friend_status === "" calls sendFriendRequest, shows success toast, and optimistically patches that user\'s friend_status to "pending"', async () => {
      vi.useFakeTimers();
      const user = friend({ id: "user-1", name: "bob", friend_status: "" });
      vi.mocked(findUsersByName).mockResolvedValue([user]);
      vi.mocked(sendFriendRequest).mockResolvedValue({
         success: true,
         message: "friend request sended",
      });

      renderIsolated(<AddFriendPanel />);
      typeAndDebounce("bob");
      vi.useRealTimers();

      const sendButton = await screen.findByText("Send request");
      fireEvent.click(sendButton);

      await waitFor(() =>
         expect(sendFriendRequest).toHaveBeenCalledWith("user-1"),
      );
      await waitFor(() =>
         expect(toast.add).toHaveBeenCalledWith({
            title: "Friend request sent",
            type: "success",
         }),
      );

      // optimistic mutate(revalidate:false) patches the row without a refetch
      await screen.findByText("Sent");
      expect(findUsersByName).toHaveBeenCalledTimes(1);
   });

   // Note on real behavior: sendFriendRequestMutation() throws on
   // `!result.success`, so useSWRMutation's trigger() rejects before
   // handleSendFriendRequest's `if (!res.success)` toast.add(...) branch is
   // ever reached — that branch is dead code. The rejection used to be
   // uncaught at the call site (try/finally, no catch), surfacing as a real
   // unhandled promise rejection — fixed by adding a `catch {}` in the
   // component (the user-visible error still comes from the inline
   // `errorMessage` paragraph, driven by useSWRMutation's own `error`
   // state, unchanged).
   it("shows the inline error message (not a toast) when sendFriendRequest fails, and does not patch friend_status", async () => {
      vi.useFakeTimers();
      const user = friend({ id: "user-1", name: "bob", friend_status: "" });
      vi.mocked(findUsersByName).mockResolvedValue([user]);
      vi.mocked(sendFriendRequest).mockResolvedValue({
         success: false,
         message: "already friends",
      });

      renderIsolated(<AddFriendPanel />);
      typeAndDebounce("bob");
      vi.useRealTimers();

      const sendButton = await screen.findByText("Send request");
      fireEvent.click(sendButton);

      await screen.findByText("already friends");
      expect(toast.add).not.toHaveBeenCalled();
      expect(screen.queryByText("Sent")).toBeNull();
      expect(screen.getByText("Send request")).not.toBeNull();
   });

   it('button is disabled and shows "Sent"/"Friends"/"Blocked" for friend_status of pending/accepted/blocked respectively, and clicking does nothing', async () => {
      vi.useFakeTimers();
      vi.mocked(findUsersByName).mockResolvedValue([
         friend({ id: "user-pending", name: "pend", friend_status: "pending" }),
         friend({ id: "user-accepted", name: "acc", friend_status: "accepted" }),
         friend({ id: "user-blocked", name: "blk", friend_status: "blocked" }),
      ]);

      renderIsolated(<AddFriendPanel />);
      typeAndDebounce("xyz");
      vi.useRealTimers();

      const sentButton = (await screen.findByText("Sent")) as HTMLButtonElement;
      const friendsButton = screen.getByText("Friends") as HTMLButtonElement;
      const blockedButton = screen.getByText("Blocked") as HTMLButtonElement;

      expect(sentButton.disabled).toBe(true);
      expect(friendsButton.disabled).toBe(true);
      expect(blockedButton.disabled).toBe(true);

      fireEvent.click(sentButton);
      fireEvent.click(friendsButton);
      fireEvent.click(blockedButton);

      expect(sendFriendRequest).not.toHaveBeenCalled();
   });

   it("only one request can be in flight at a time (sendingId guard) — second click while sending is a no-op", async () => {
      vi.useFakeTimers();
      const user = friend({ id: "user-1", name: "bob", friend_status: "" });
      vi.mocked(findUsersByName).mockResolvedValue([user]);
      let resolveSend: (res: { success: boolean; message: string }) => void =
         () => {};
      vi.mocked(sendFriendRequest).mockImplementation(
         () =>
            new Promise((resolve) => {
               resolveSend = resolve;
            }),
      );

      renderIsolated(<AddFriendPanel />);
      typeAndDebounce("bob");
      vi.useRealTimers();

      const sendButton = await screen.findByText("Send request");
      fireEvent.click(sendButton);

      // now "Sending..." and disabled — a second click is a no-op
      const sendingButton = await screen.findByText("Sending...");
      fireEvent.click(sendingButton);

      expect(sendFriendRequest).toHaveBeenCalledTimes(1);

      act(() => {
         resolveSend({ success: true, message: "friend request sended" });
      });
      await screen.findByText("Sent");
   });
});
