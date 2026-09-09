import ChatItem from "@/components/chat/ChatItem";
import { toast } from "@/components/ui/toast";
import { addReaction, editMessage, removeReaction } from "@/lib/api/messages";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// TODO: still need coverage for —
//
// Edit flow (handleSaveEdit / handleCancelEdit):
// - (done) saving with empty/unchanged content: exits edit mode WITHOUT calling editMessage
// - (done) saving successfully: editMessage called, onEdit prop called with (id, content), exits edit mode
// - (done) saving fails: shows error toast, and (per current code) stays IN edit mode — confirm this is intended
// - (done) pressing Escape while editing: handleCancelEdit resets content and exits edit mode
//
// Reactions (handleToggleReaction):
// - (done) isBanned=true: clicking a reaction does nothing, no addReaction/removeReaction call
// - (done) already reacted with that emoji: calls removeReaction, not addReaction
// - (done) not yet reacted: calls addReaction, not removeReaction
// - A(done) PI call fails: shows error toast
//
// Failed message state (message._status === "failed"):
// - (done) shows "Failed to send." + Dismiss button instead of normal content
// - (done) MessageMenu is not rendered at all when isFailed
// - (done) clicking Dismiss calls handleDelete(message.id)
//
// Guard clauses (quick one-liners):
// - (done) ReplyThread renders nothing unless parent_content AND parent_msg_id AND parent_username are all present
// - (done) MessageContent renders nothing when there's no image and content is empty/whitespace-only
// - (done) MessageHeader shows no time string when created_at is an invalid date
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
   created_at: new Date(Date.now() - 60 * 1000).toISOString(),
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

   it("MessageHeader shows no time when created_at is invalid", async () => {
      render(<ChatItem
         isBanned={false}
         variant="channel"
         currentUser="user_001"
         message={{
            ...msg,
            created_at: "not-a-real-date"
         }}
         serverId="srv-1"
         hasPermissionManageMessages={true}
         onToggleReaction={vi.fn()}
      />);

      // header itself still renders (username), only the formatted time is omitted
      expect(screen.queryByTitle("msg-header")).not.toBeNull()
      expect(screen.queryByText(/\d{1,2}:\d{2}\s?[AP]M/i)).toBeNull()
   });
   it("MessageContent not visible if no image and no content", async () => {
      render(<ChatItem
         isBanned={false}
         variant="channel"
         currentUser="user_001"
         message={{
            ...msg,
            content: "",
            image_url: ""
         }}
         serverId="srv-1"
         hasPermissionManageMessages={true}
         onToggleReaction={vi.fn()}
      />);

      expect(screen.queryByTitle("content")).toBeNull()
   });


   it("ReplyThread not visible if no parent content", async () => {
      render(<ChatItem
         isBanned={false}
         variant="channel"
         currentUser="user_001"
         message={{
            ...msg,
            parent_content: null,
            parent_msg_id: null,
            parent_username: null,
         }}
         serverId="srv-1"
         hasPermissionManageMessages={true}
         onToggleReaction={vi.fn()}
      />);

      expect(screen.queryByTitle("thread-reply")).toBeNull()
   });

   it("shows Failed to send. + Dismiss button instead of normal content", async () => {
      const handleDelete = vi.fn()
      const failedMsg = { ...msg, _status: "failed" as const }
      render(<ChatItem
         isBanned={false}
         variant="channel"
         currentUser="user_001"
         message={failedMsg}
         handleDelete={handleDelete}
         serverId="srv-1"
         hasPermissionManageMessages={true}
         onToggleReaction={vi.fn()}
      />);

      expect(screen.getByText(/Failed to send/i)).not.toBeFalsy()

      fireEvent.click(await screen.findByText("Dismiss"));

      expect(handleDelete).toHaveBeenCalledWith(failedMsg.id);
      expect(screen.queryByText(/Add Reaction/i)).toBeNull();

   });

   it("API calls failed, show toast", async () => {
      render(<ChatItem
         isBanned={false}
         variant="channel"
         currentUser="user_001"
         message={msg}
         serverId="srv-1"
         hasPermissionManageMessages={true}
         onToggleReaction={vi.fn()}
      />);
      vi.mocked(addReaction).mockRejectedValue(new Error("network error"))

      const badge = await screen.findByText("👋");
      fireEvent.click(badge);

      expect(addReaction).toHaveBeenCalled();

      await waitFor(() => expect(toast.add).toHaveBeenCalled());
   });

   it("calls addreaction when not reacted with that emoji", async () => {
      render(<ChatItem
         isBanned={false}
         variant="channel"
         currentUser="user_001"
         message={msg}
         serverId="srv-1"
         hasPermissionManageMessages={true}
         onToggleReaction={vi.fn()}
      />);

      const badge = await screen.findByText("👋");
      fireEvent.click(badge);

      await waitFor(() => expect(addReaction).toHaveBeenCalledWith({
         message_id: msg.id,
         emoji: "👋",
      }));
   });


   it("calls removeReaction when already reacted with that emoji", async () => {
      render(<ChatItem
         isBanned={false}
         variant="channel"
         currentUser="user_002"
         message={msg}
         serverId="srv-1"
         hasPermissionManageMessages={true}
         onToggleReaction={vi.fn()}
      />);

      const badge = await screen.findByText("👋");
      fireEvent.click(badge);

      await waitFor(() => expect(removeReaction).toHaveBeenCalledWith({
         message_id: msg.id,
         emoji: "👋",
      }));
      expect(addReaction).not.toHaveBeenCalled();
   });

   it("should not be able to give reaction if user banned", async () => {
      render(<ChatItem
         isBanned={true}
         variant="channel"
         currentUser="user_001"
         message={msg}
         serverId="srv-1"
         hasPermissionManageMessages={true}
      />);

      expect(screen.queryByText(/Add Reaction/i)).toBeNull();
      expect(addReaction).not.toHaveBeenCalled()
      expect(removeReaction).not.toHaveBeenCalled()
   });

   it("show toast and stay in edit mode if submit fail", async () => {
      render(<ChatItem
         isBanned={false}
         variant="channel"
         currentUser="user_001"
         message={msg}
         serverId="srv-1"
         hasPermissionManageMessages={true}
      />);
      vi.mocked(editMessage).mockRejectedValueOnce(new Error("network error"));

      fireEvent.click(await screen.findByText(/Edit Message/i));
      const textarea = await screen.findByTitle("edit");
      fireEvent.change(textarea, { target: { value: "hiii" } });

      fireEvent.keyDown(textarea, { key: "Enter" });


      await waitFor(() => expect(toast.add).toHaveBeenCalled());
      expect(editMessage).toHaveBeenCalled();

      expect(screen.queryByTitle("edit")).not.toBeNull();
   });

   it("press escape should exit edit mode", async () => {
      render(<ChatItem
         isBanned={false}
         variant="channel"
         currentUser="user_001"
         message={msg}
         serverId="srv-1"
         hasPermissionManageMessages={true}
      />);
      fireEvent.click(await screen.findByText(/Edit Message/i));
      const textarea = await screen.findByTitle("edit");

      fireEvent.change(textarea, { target: { value: "hi" } })
      fireEvent.keyDown(textarea, { key: 'Escape', code: 'Escape', keyCode: 27 })
      expect(screen.queryByTitle("edit")).toBeNull();


      expect(editMessage).not.toHaveBeenCalled();

      fireEvent.click(await screen.findByText(/Edit Message/i));
      const reopened = await screen.findByTitle("edit");
      expect((reopened as HTMLTextAreaElement).value).toBe(msg.content);

   });

   it("skips save on unchanged content", async () => {
      render(<ChatItem
         isBanned={false}
         variant="channel"
         currentUser="user_001"
         message={msg}
         serverId="srv-1"
         hasPermissionManageMessages={true}
      />);
      fireEvent.click(await screen.findByText(/Edit Message/i));
      const textarea = await screen.findByTitle("edit");

      fireEvent.keyDown(textarea, { key: "Enter" }); // content unchanged
      expect(editMessage).not.toHaveBeenCalled();
      // edit mode closed → textarea gone
      expect(screen.queryByTitle("edit")).toBeNull();
   });

   it("should success edit message", async () => {
      render(
         <ChatItem
            isBanned={false}
            variant="channel"
            currentUser="user_001"
            message={msg}
            serverId="srv-1"
            hasPermissionManageMessages={true}
         />
      );
      const el = await screen.findByText(/Edit Message/i);
      fireEvent.click(el)


      const input = (await screen.findByTitle("edit"))


      fireEvent.change(input, { target: { value: "hiii" } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', keyCode: 13 });
      expect(editMessage).toHaveBeenCalledWith({ id: "msg_001", content: "hiii", channel_id: "channel_001" })

      expect(screen.queryByText("hiii")).not.toBeNull()

   })
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
