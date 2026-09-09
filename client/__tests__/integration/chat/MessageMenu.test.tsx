// components/chat/MessageMenu.tsx
//
// Why: the actual menu-item-list logic (permissions/ownership/banned gating
// per item) lives here, not in ChatItem — ChatItem.test.tsx currently stubs
// this component entirely per its own TODO note, so this is genuinely
// untested.

import MessageMenu from "@/components/chat/MessageMenu";
import { deleteMessage, pinMessage } from "@/lib/actions/messages";
import { copyText } from "@/lib/clipboard";
import { toast } from "@/components/ui/toast";
import type { Message } from "@/types/chat";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/clipboard", () => ({
  copyText: vi.fn(),
}));

vi.mock("@/lib/actions/messages", () => ({
  deleteMessage: vi.fn(),
  pinMessage: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));

// Out of scope here — CreateThreadForm has its own form/dialog logic;
// MessageMenu's job is just deciding whether to render it.
vi.mock("@/components/chat/CreateThreadForm", () => ({
  default: () => <div>create-thread-form-stub</div>,
}));

afterEach(() => {
  cleanup();
});

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "msg_1",
    content: "hello world",
    user_id: "user_1",
    username: "wira",
    avatar: "",
    image_url: "",
    image_asset_id: "asset_1",
    channel_id: "chan_1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parent_msg_id: null,
    parent_content: null,
    parent_username: null,
    reactions: [],
    thread_id: null,
    threads: [],
    ...overrides,
  };
}

type Props = ComponentProps<typeof MessageMenu>;

function makeProps(overrides: Partial<Props> = {}): Props {
  return {
    message: makeMessage(),
    serverId: "srv_1",
    onDelete: vi.fn(),
    currentUser: "user_1", // matches message.user_id by default -> owner
    hasPermissionManageMessages: false,
    isBanned: false,
    ...overrides,
  };
}

describe("MessageMenu", () => {
  describe('"Edit Message" visibility', () => {
    it("shows when the current user owns the message, onEdit is provided, and not banned", () => {
      render(<MessageMenu {...makeProps({ onEdit: vi.fn() })} />);
      expect(screen.getByText("Edit Message")).toBeTruthy();
    });

    it("hides when the current user does not own the message", () => {
      render(
        <MessageMenu
          {...makeProps({ currentUser: "someone_else", onEdit: vi.fn() })}
        />,
      );
      expect(screen.queryByText("Edit Message")).toBeNull();
    });

    it("hides when onEdit is not provided", () => {
      render(<MessageMenu {...makeProps()} />);
      expect(screen.queryByText("Edit Message")).toBeNull();
    });

    it("hides when isBanned, even for the owner with onEdit provided", () => {
      render(
        <MessageMenu {...makeProps({ onEdit: vi.fn(), isBanned: true })} />,
      );
      expect(screen.queryByText("Edit Message")).toBeNull();
    });
  });

  describe('"Create Thread" visibility', () => {
    it("renders (as CreateThreadForm) when hasPermissionManageMessages and not banned", () => {
      render(
        <MessageMenu {...makeProps({ hasPermissionManageMessages: true })} />,
      );
      expect(screen.getByText("create-thread-form-stub")).toBeTruthy();
    });

    it("does not render when hasPermissionManageMessages is false", () => {
      render(
        <MessageMenu
          {...makeProps({ hasPermissionManageMessages: false })}
        />,
      );
      expect(screen.queryByText("create-thread-form-stub")).toBeNull();
    });

    it("does not render when isBanned, even with manage-messages permission", () => {
      render(
        <MessageMenu
          {...makeProps({ hasPermissionManageMessages: true, isBanned: true })}
        />,
      );
      expect(screen.queryByText("create-thread-form-stub")).toBeNull();
    });
  });

  describe('"Delete Message" visibility', () => {
    it("shows for the message owner, no manage permission needed", () => {
      render(<MessageMenu {...makeProps({ currentUser: "user_1" })} />);
      expect(screen.getByText("Delete Message")).toBeTruthy();
    });

    it("shows for a non-owner who has manage-messages permission", () => {
      render(
        <MessageMenu
          {...makeProps({
            currentUser: "someone_else",
            hasPermissionManageMessages: true,
          })}
        />,
      );
      expect(screen.getByText("Delete Message")).toBeTruthy();
    });

    it("hides for a non-owner without manage-messages permission", () => {
      render(
        <MessageMenu
          {...makeProps({
            currentUser: "someone_else",
            hasPermissionManageMessages: false,
          })}
        />,
      );
      expect(screen.queryByText("Delete Message")).toBeNull();
    });
  });

  it("isBanned hides every action except Reply, Copy Text, and More Options", () => {
    // Note: "Delete Message" is gated by `!isBanned && (owner || hasPermission...)`
    // in useMenuActions, so — despite this suite's original TODO wording —
    // it is NOT among the survivors below; it's hidden for banned users too.
    render(
      <MessageMenu
        {...makeProps({
          currentUser: "user_1", // owner
          hasPermissionManageMessages: true,
          onEdit: vi.fn(),
          isBanned: true,
        })}
      />,
    );

    expect(screen.getByText("Reply")).toBeTruthy();
    expect(screen.getByText("Copy Text")).toBeTruthy();
    expect(screen.getByText("More Options")).toBeTruthy();

    expect(screen.queryByText("Edit Message")).toBeNull();
    expect(screen.queryByText("create-thread-form-stub")).toBeNull();
    expect(screen.queryByText("Forward Message")).toBeNull();
    expect(screen.queryByText("Pin Message")).toBeNull();
    expect(screen.queryByText("Add Reaction")).toBeNull();
    expect(screen.queryByText("Bookmark")).toBeNull();
    expect(screen.queryByText("Delete Message")).toBeNull();
  });

  describe('clicking "Pin Message"', () => {
    it("calls pinMessage with (message id, channel id, server id) and shows a success toast", async () => {
      vi.mocked(pinMessage).mockResolvedValue({
        success: true,
        message: "message pinned",
      });
      const message = makeMessage({ id: "msg_9", channel_id: "chan_9" });
      render(
        <MessageMenu
          {...makeProps({
            message,
            serverId: "srv_9",
            hasPermissionManageMessages: true,
          })}
        />,
      );

      fireEvent.click(screen.getByText("Pin Message"));

      await waitFor(() =>
        expect(pinMessage).toHaveBeenCalledWith("msg_9", "chan_9", "srv_9"),
      );
      await waitFor(() =>
        expect(toast.add).toHaveBeenCalledWith({
          title: "Message pinned",
          type: "success",
        }),
      );
    });

    it("shows an error toast when pinMessage fails", async () => {
      vi.mocked(pinMessage).mockResolvedValue({
        success: false,
        message: "not allowed",
      });
      render(
        <MessageMenu {...makeProps({ hasPermissionManageMessages: true })} />,
      );

      fireEvent.click(screen.getByText("Pin Message"));

      await waitFor(() =>
        expect(toast.add).toHaveBeenCalledWith({
          title: "not allowed",
          type: "error",
        }),
      );
    });
  });

  describe('clicking "Delete Message"', () => {
    it("calls deleteMessage, then onDelete, and shows a success toast", async () => {
      vi.mocked(deleteMessage).mockResolvedValue({
        success: true,
        message: "message has been deleted",
      });
      const onDelete = vi.fn();
      const message = makeMessage({
        id: "msg_5",
        image_asset_id: "asset_5",
        channel_id: "chan_5",
      });
      render(
        <MessageMenu
          {...makeProps({
            message,
            serverId: "srv_5",
            onDelete,
            currentUser: message.user_id,
          })}
        />,
      );

      fireEvent.click(screen.getByText("Delete Message"));

      await waitFor(() =>
        expect(deleteMessage).toHaveBeenCalledWith({
          id: "msg_5",
          public_id: "asset_5",
          channel_id: "chan_5",
          server_id: "srv_5",
        }),
      );
      await waitFor(() => expect(onDelete).toHaveBeenCalledWith("msg_5"));
      expect(toast.add).toHaveBeenCalledWith({
        title: "Message deleted",
        type: "success",
      });
    });

    it("still calls onDelete and shows an error toast when deleteMessage fails", async () => {
      vi.mocked(deleteMessage).mockResolvedValue({
        success: false,
        message: "server error",
      });
      const onDelete = vi.fn();
      const message = makeMessage({ id: "msg_6" });
      render(
        <MessageMenu
          {...makeProps({ message, onDelete, currentUser: message.user_id })}
        />,
      );

      fireEvent.click(screen.getByText("Delete Message"));

      await waitFor(() => expect(onDelete).toHaveBeenCalledWith("msg_6"));
      await waitFor(() =>
        expect(toast.add).toHaveBeenCalledWith({
          title: "server error",
          type: "error",
        }),
      );
    });
  });

  describe('clicking "Copy Text"', () => {
    it("calls copyText with the message content and shows a success toast", async () => {
      vi.mocked(copyText).mockResolvedValue(true);
      const message = makeMessage({ content: "copy me" });
      render(<MessageMenu {...makeProps({ message })} />);

      fireEvent.click(screen.getByText("Copy Text"));

      await waitFor(() => expect(copyText).toHaveBeenCalledWith("copy me"));
      await waitFor(() =>
        expect(toast.add).toHaveBeenCalledWith({
          title: "Text copied!",
          type: "success",
        }),
      );
    });

    it("shows an error toast when copyText rejects", async () => {
      vi.mocked(copyText).mockRejectedValue(
        new Error("Clipboard API not available"),
      );
      render(<MessageMenu {...makeProps()} />);

      fireEvent.click(screen.getByText("Copy Text"));

      await waitFor(() =>
        expect(toast.add).toHaveBeenCalledWith({
          title: "Clipboard API not available",
          type: "error",
        }),
      );
    });
  });
});
