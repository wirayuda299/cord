// components/members/FriendList.tsx
//
// Why: invite-link generation on mount with a cancellation guard, search
// filter, copy-with-timed-reset feedback (needs fake timers).

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FriendList from "@/components/members/FriendList";
import { createInvitationCode } from "@/lib/actions/invitations";
import { copyText } from "@/lib/clipboard";
import type { FriendListItem } from "@/types/friends";

afterEach(() => {
   cleanup();
   vi.useRealTimers();
});

vi.mock("@/lib/actions/invitations", () => ({
   createInvitationCode: vi.fn(),
}));

vi.mock("@/lib/clipboard", () => ({
   copyText: vi.fn(),
}));

beforeEach(() => {
   vi.mocked(createInvitationCode).mockResolvedValue({ success: true, data: "DEFAULT" });
   vi.mocked(copyText).mockResolvedValue(true);
});

function friend(overrides: Partial<FriendListItem>): FriendListItem {
   return {
      friendship_id: "fr-1",
      user_id: "user-1",
      username: "alice",
      avatar_url: "",
      status: "accepted",
      created_at: "2026-01-01T00:00:00Z",
      ...overrides,
   };
}

describe("FriendList (members)", () => {
   it("on success with a plain-string data shape, sets inviteLink to `${origin}/invite/${code}`", async () => {
      vi.mocked(createInvitationCode).mockResolvedValue({ success: true, data: "PLAINCODE" });

      render(<FriendList serverId="srv-1" friends={[]} />);

      await screen.findByText(`${window.location.origin}/invite/PLAINCODE`);
      expect(createInvitationCode).toHaveBeenCalledWith("srv-1");
   });

   it("on success with a nested {data:{code}} shape, sets inviteLink to `${origin}/invite/${code}`", async () => {
      vi.mocked(createInvitationCode).mockResolvedValue({
         success: true,
         // @ts-expect-error -- exercising the nested-shape branch the component defensively unwraps
         data: { data: { code: "NESTEDCODE" } },
      });

      render(<FriendList serverId="srv-1" friends={[]} />);

      await screen.findByText(`${window.location.origin}/invite/NESTEDCODE`);
   });

   it("createInvitationCode returning {success:false} sets linkError and shows that message instead of the link", async () => {
      vi.mocked(createInvitationCode).mockResolvedValue({
         success: false,
         message: "Server unreachable",
      });

      render(<FriendList serverId="srv-1" friends={[]} />);

      await screen.findByText("Server unreachable");
      expect(screen.queryByText(/\/invite\//)).toBeNull();
   });

   it("unmounting before the invite-link promise resolves must not call setInviteLink/setLinkError", async () => {
      let resolvePromise: (v: { success: boolean; data: string }) => void = () => {};
      const pending = new Promise<{ success: boolean; data: string }>((resolve) => {
         resolvePromise = resolve;
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(createInvitationCode).mockReturnValue(pending as any);

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { unmount } = render(<FriendList serverId="srv-1" friends={[]} />);
      unmount();

      await act(async () => {
         resolvePromise({ success: true, data: "TOO-LATE" });
         await pending;
      });

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
   });

   it("typing in search filters the friends list by username (case-insensitive includes)", () => {
      render(
         <FriendList
            serverId="srv-1"
            friends={[friend({ user_id: "u1", username: "Alice" }), friend({ user_id: "u2", username: "bob" })]}
         />,
      );

      const input = screen.getByPlaceholderText("Search friends");
      fireEvent.change(input, { target: { value: "ALI" } });

      expect(screen.getByText("Alice")).not.toBeNull();
      expect(screen.queryByText("bob")).toBeNull();
   });

   it('empty state: "No friends yet" when there are no friends at all', () => {
      render(<FriendList serverId="srv-1" friends={[]} />);

      expect(screen.getByText("No friends yet")).not.toBeNull();
   });

   it('empty state: "No matching friends" when search excludes everyone', () => {
      render(<FriendList serverId="srv-1" friends={[friend({ username: "Alice" })]} />);

      fireEvent.change(screen.getByPlaceholderText("Search friends"), {
         target: { value: "zzz-no-match" },
      });

      expect(screen.getByText("No matching friends")).not.toBeNull();
   });

   it('clicking "Copy link" on a row calls copyText, shows "Copied" for 1.5s then reverts, and is disabled until inviteLink exists', async () => {
      vi.useFakeTimers();
      let resolvePromise: (v: { success: boolean; data: string }) => void = () => {};
      const pending = new Promise<{ success: boolean; data: string }>((resolve) => {
         resolvePromise = resolve;
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(createInvitationCode).mockReturnValue(pending as any);

      render(<FriendList serverId="srv-1" friends={[friend({ user_id: "u1", username: "Alice" })]} />);

      const copyButton = screen.getByTitle("Copy invite link") as HTMLButtonElement;
      expect(copyButton.disabled).toBe(true);

      await act(async () => {
         resolvePromise({ success: true, data: "ROWCODE" });
         await pending;
      });

      expect(copyButton.disabled).toBe(false);

      fireEvent.click(copyButton);
      // flush copyText()'s resolved .then(...)
      await act(async () => {
         await Promise.resolve();
      });

      expect(copyText).toHaveBeenCalledWith(`${window.location.origin}/invite/ROWCODE`);
      expect(screen.getByText("Copied")).not.toBeNull();

      act(() => {
         vi.advanceTimersByTime(1500);
      });

      expect(screen.queryByText("Copied")).toBeNull();
      expect(screen.getByText("Copy link")).not.toBeNull();
   });
});
