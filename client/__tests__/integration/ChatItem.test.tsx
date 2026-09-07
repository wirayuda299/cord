import ChatItem from "@/components/chat/ChatItem";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// TODO: still need coverage for —
//
// Edit flow (handleSaveEdit / handleCancelEdit):
// - saving with empty/unchanged content: exits edit mode WITHOUT calling editMessage
// - saving successfully: editMessage called, onEdit prop called with (id, content), exits edit mode
// - saving fails: shows error toast, and (per current code) stays IN edit mode — confirm this is intended
// - pressing Escape while editing: handleCancelEdit resets content and exits edit mode
//
// Reactions (handleToggleReaction):
// - isBanned=true: clicking a reaction does nothing, no addReaction/removeReaction call
// - already reacted with that emoji: calls removeReaction, not addReaction
// - not yet reacted: calls addReaction, not removeReaction
// - API call fails: shows error toast
//
// Failed message state (message._status === "failed"):
// - shows "Failed to send." + Dismiss button instead of normal content
// - MessageMenu is not rendered at all when isFailed
// - clicking Dismiss calls handleDelete(message.id)
//
// Guard clauses (quick one-liners):
// - ReplyThread renders nothing unless parent_content AND parent_msg_id AND parent_username are all present
// - MessageContent renders nothing when there's no image and content is empty/whitespace-only
// - MessageHeader shows no time string when created_at is an invalid date
//
// Consider: stub out MessageMenu (vi.mock) for these instead of using the
// real one, so these tests only assert what ChatItem itself computed and
// passed down (e.g. onEdit truthy/undefined) rather than depending on
// MessageMenu's own menu-item rendering logic.

afterEach(() => {
   cleanup();
   // harmless no-op if a given test never switched to fake timers
   vi.useRealTimers();
});

vi.mock("@/lib/api/messages", () => ({
   addReaction: vi.fn(),
   editMessage: vi.fn(),
   removeReaction: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
   toast: {
      add: vi.fn(),
   },
}));

vi.mock("next/navigation", () => ({
   useRouter: vi.fn(),
   usePathname: vi.fn(),
}));

const msg = {
   id: "msg_001",
   content: "Hey everyone, how's the project going?",
   user_id: "user_001",
   username: "wira",
   avatar: "https://i.pravatar.cc/150?img=12",
   image_url: "",
   image_asset_id: "",
   channel_id: "channel_001",
   created_at: "2026-09-08T02:15:00.000Z",
   updated_at: "2026-09-08T02:15:00.000Z",
   parent_msg_id: null,
   parent_content: null,
   parent_username: null,
   reactions: [
      {
         user_id: "user_002",
         emoji: "👋",
      },
      {
         user_id: "user_003",
         emoji: "👋",
      },
      {
         user_id: "user_004",
         emoji: "❤️",
      },
   ],
   thread_id: null,
   threads: [
      {
         id: "thread_001",
         name: "Project discussion",
      },
   ],
};

describe("Chat item test", () => {
   it("should be able to edit text", async () => {
      render(
         <ChatItem
            isBanned={false}
            variant="channel"
            currentUser="user_001"
            message={msg}
            serverId="srv-1"
            hasPermissionManageMessages={true}
         />,
      );

      await screen.findByText(/Edit Message/i);
   });

   it("should render message, threads and reactions", async () => {
      render(
         <ChatItem
            isBanned={false}
            variant="channel"
            currentUser="user_001"
            message={msg}
            serverId="srv-1"
            hasPermissionManageMessages={true}
         />,
      );

      await screen.findByText(/Hey everyone, how's the project going?/i);
      await screen.findByText("👋");
      await screen.findByText(/Project discussion/i);
   });

   it("should not render edit message", async () => {
      render(
         <ChatItem
            isBanned={false}
            variant="channel"
            currentUser="user_002"
            message={msg}
            serverId="srv-1"
            hasPermissionManageMessages={true}
         />,
      );

      expect(screen.queryByText(/Edit Message/i)).toBeNull();
   });

   it("cannot edit when the message is older than the 5-minute edit window", async () => {
      const oldMessage = {
         ...msg,
         // computed relative to now, not a hardcoded date — always 6 min
         // old no matter when this suite actually runs
         created_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      };

      render(
         <ChatItem
            isBanned={false}
            variant="channel"
            currentUser={oldMessage.user_id} // matches, so only the time window is under test
            message={oldMessage}
            serverId="srv-1"
            hasPermissionManageMessages={true}
         />,
      );

      await screen.findByText(oldMessage.username);
      expect(screen.queryByText(/Edit Message/i)).toBeNull();
   });

   it("cannot edit anymore once the 5-minute edit window expires while mounted", async () => {
      vi.useFakeTimers();

      const freshMessage = {
         ...msg,
         created_at: new Date().toISOString(), // within the window right now
      };

      render(
         <ChatItem
            isBanned={false}
            variant="channel"
            currentUser={freshMessage.user_id}
            message={freshMessage}
            serverId="srv-1"
            hasPermissionManageMessages={true}
         />,
      );

      // still within the window immediately after mount
      expect(screen.queryByText(/Edit Message/i)).not.toBeNull();

      // the component schedules its own setTimeout for the remaining
      // window — advancing past it flips isWithinEditWindow to false
      act(() => {
         vi.advanceTimersByTime(5 * 60 * 1000 + 1);
      });

      expect(screen.queryByText(/Edit Message/i)).toBeNull();
   });
});
