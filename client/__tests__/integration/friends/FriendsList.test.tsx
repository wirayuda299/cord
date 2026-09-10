// components/friends/FriendsList.tsx
//
// Why: filter="online" vs "all" changes both the visible list and the
// empty-state copy, based on the Zustand onlineUserIds set.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FriendsList from "@/components/friends/FriendsList";
import { startConversation } from "@/lib/actions/conversations";
import { useAppStore } from "@/stores/store";
import type { FriendListItem } from "@/types/friends";

afterEach(() => {
   cleanup();
});

vi.mock("@/lib/actions/conversations", () => ({
   startConversation: vi.fn(),
}));

beforeEach(() => {
   useAppStore.setState({ onlineUserIds: new Set() });
});

function friendItem(overrides: Partial<FriendListItem>): FriendListItem {
   return {
      friendship_id: "fs-1",
      user_id: "user-1",
      username: "alice",
      avatar_url: "",
      status: "accepted",
      created_at: "2026-01-01T00:00:00Z",
      ...overrides,
   };
}

describe("FriendsList", () => {
   it('filter="online" shows only friends whose user_id is in onlineUserIds; filter="all" (default) shows everyone', () => {
      const friends = [
         friendItem({ friendship_id: "fs-1", user_id: "user-1", username: "alice" }),
         friendItem({ friendship_id: "fs-2", user_id: "user-2", username: "bob" }),
      ];
      useAppStore.setState({ onlineUserIds: new Set(["user-1"]) });

      const { rerender } = render(<FriendsList friends={friends} filter="online" />);
      expect(screen.getByText("alice")).not.toBeNull();
      expect(screen.queryByText("bob")).toBeNull();

      rerender(<FriendsList friends={friends} filter="all" />);
      expect(screen.getByText("alice")).not.toBeNull();
      expect(screen.getByText("bob")).not.toBeNull();
   });

   it('empty state text differs: "No friends online" vs "No friend yet" depending on filter', () => {
      const friends = [
         friendItem({ friendship_id: "fs-1", user_id: "user-1", username: "alice" }),
      ];
      useAppStore.setState({ onlineUserIds: new Set() });

      const { rerender } = render(<FriendsList friends={friends} filter="online" />);
      expect(screen.getByText("No friends online")).not.toBeNull();

      rerender(<FriendsList friends={[]} filter="all" />);
      expect(screen.getByText("No friend yet")).not.toBeNull();
   });

   it('each row\'s online/offline indicator and "Online"/"Offline" label reflect onlineUserIds.has(user_id)', () => {
      const friends = [
         friendItem({ friendship_id: "fs-1", user_id: "user-1", username: "alice" }),
         friendItem({ friendship_id: "fs-2", user_id: "user-2", username: "bob" }),
      ];
      useAppStore.setState({ onlineUserIds: new Set(["user-1"]) });

      render(<FriendsList friends={friends} filter="all" />);

      expect(screen.getByText("Online")).not.toBeNull();
      expect(screen.getByText("Offline")).not.toBeNull();
   });

   it('the "message" button is a <form action={startConversation}> — submitting it invokes startConversation with the hidden targeted_user_id field', () => {
      const friends = [
         friendItem({ friendship_id: "fs-1", user_id: "user-42", username: "alice" }),
      ];

      const { container } = render(<FriendsList friends={friends} filter="all" />);

      const form = container.querySelector("form") as HTMLFormElement;
      expect(form).not.toBeNull();

      const hiddenInput = form.querySelector(
         'input[name="targeted_user_id"]',
      ) as HTMLInputElement;
      expect(hiddenInput.value).toBe("user-42");

      fireEvent.submit(form);

      expect(startConversation).toHaveBeenCalled();
      const formDataArg = vi.mocked(startConversation).mock.calls[0][0] as FormData;
      expect(formDataArg.get("targeted_user_id")).toBe("user-42");
   });
});
