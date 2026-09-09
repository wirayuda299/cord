import ChatList from "@/components/chat/ChatList";
import { useWebSocket } from "@/hooks/useWebsocket";
import { hasPermission } from "@/lib/api/permissions";
import { isMemberBanned } from "@/lib/actions/members";
import type { Message, ResponseMessage } from "@/types/chat";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps, ReactElement } from "react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useWebsocket", () => ({
  useWebSocket: vi.fn(),
}));

vi.mock("@/lib/api/permissions", () => ({
  hasPermission: vi.fn(),
}));

vi.mock("@/lib/actions/members", () => ({
  isMemberBanned: vi.fn(),
}));

// Stubbed out so these tests only assert what ChatList itself computed and
// passed down, not ChatItem/ChatForm/MemberList's own rendering logic.
vi.mock("@/components/chat/ChatItem", () => ({
  default: ({
    message,
    isBanned,
  }: {
    message: Message;
    isBanned?: boolean;
  }) => (
    <div
      data-testid="chat-item"
      data-message-id={message.id}
      data-banned={String(isBanned)}
    >
      {message.content}
    </div>
  ),
}));

vi.mock("@/components/chat/ChatForm", () => ({
  default: ({ isBanned }: { isBanned?: boolean }) => (
    <div data-testid="chat-form" data-banned={String(isBanned)} />
  ),
}));

vi.mock("@/components/members/MemberList", () => ({
  default: () => <div data-testid="member-list-stub" />,
}));

let capturedOptions: {
  onMessage?: (msg: ResponseMessage) => void;
  onDelete?: (id: string) => void;
} = {};

beforeEach(() => {
  // jsdom doesn't implement this — ChatList calls it in an effect on every
  // messages change.
  window.HTMLElement.prototype.scrollIntoView = vi.fn();

  capturedOptions = {};
  vi.mocked(useWebSocket).mockImplementation(
    (_serverId, _channelId, options) => {
      capturedOptions = options;
      return { sendMessage: vi.fn(() => true), status: "connected" };
    },
  );
  vi.mocked(hasPermission).mockResolvedValue(false);
  vi.mocked(isMemberBanned).mockResolvedValue({
    success: true,
    data: false,
    message: "ok",
  });
});

afterEach(() => {
  cleanup();
});

function renderIsolated(ui: ReactElement) {
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>,
  );
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "m1",
    content: "hello",
    user_id: "user_1",
    username: "wira",
    avatar: "",
    image_url: "",
    image_asset_id: "",
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

type Props = ComponentProps<typeof ChatList>;

function makeChannel(overrides: Partial<Props["channel"]> = {}) {
  return {
    id: "chan_1",
    channel_type: "text",
    name: "general",
    topic: "",
    ...overrides,
  };
}

function makeProps(overrides: Partial<Props> = {}): Props {
  return {
    channel: makeChannel(),
    serverOwner: "owner_1",
    serverId: "srv_1",
    historyMessages: [],
    currentUser: "user_1",
    ...overrides,
  };
}

describe("ChatList", () => {
  it("handleMessages filters by channel_id/thread_id, merges existing messages by id, and appends new ones in order", () => {
    const m1 = makeMessage({ id: "m1", content: "first" });
    const m2 = makeMessage({ id: "m2", content: "second" });

    renderIsolated(<ChatList {...makeProps({ historyMessages: [m1, m2] })} />);

    act(() => {
      capturedOptions.onMessage?.({
        channel_id: "chan_1",
        server_id: "srv_1",
        messages: [
          makeMessage({ id: "m2", content: "second-updated" }), // update in place
          makeMessage({ id: "m3", content: "third" }), // new -> appended
          makeMessage({
            id: "m4",
            content: "wrong-channel",
            channel_id: "chan_other",
          }), // filtered out
          makeMessage({ id: "m5", content: "thread-reply", thread_id: "th_1" }), // filtered out (main view, not a thread)
        ],
      });
    });

    const items = screen.getAllByTestId("chat-item");
    expect(items.map((el) => el.textContent)).toEqual([
      "first",
      "second-updated",
      "third",
    ]);
  });

  it("handleMessages (in a thread view) only accepts messages whose thread_id matches", () => {
    const m1 = makeMessage({ id: "m1", content: "root", thread_id: "th_1" });

    renderIsolated(
      <ChatList {...makeProps({ historyMessages: [m1], thread_id: "th_1" })} />,
    );

    act(() => {
      capturedOptions.onMessage?.({
        channel_id: "chan_1",
        server_id: "srv_1",
        messages: [
          makeMessage({ id: "m2", content: "same-thread", thread_id: "th_1" }),
          makeMessage({ id: "m3", content: "other-thread", thread_id: "th_2" }),
          makeMessage({
            id: "m4",
            content: "channel-message",
            thread_id: null,
          }),
        ],
      });
    });

    const items = screen.getAllByTestId("chat-item");
    expect(items.map((el) => el.textContent)).toEqual(["root", "same-thread"]);
  });

  it("handleDelete removes a message from local state entirely", () => {
    const m1 = makeMessage({ id: "m1", content: "first" });
    const m2 = makeMessage({ id: "m2", content: "second" });

    renderIsolated(<ChatList {...makeProps({ historyMessages: [m1, m2] })} />);
    expect(screen.getAllByTestId("chat-item")).toHaveLength(2);

    act(() => {
      capturedOptions.onDelete?.("m1");
    });

    const items = screen.getAllByTestId("chat-item");
    expect(items.map((el) => el.textContent)).toEqual(["second"]);
  });

  describe("MemberList visibility", () => {
    it("renders when it's not a direct message", () => {
      renderIsolated(
        <ChatList
          {...makeProps({
            variant: "server",
            channel: makeChannel({ channel_type: "text" }),
          })}
        />,
      );
      expect(screen.queryByTestId("member-list-stub")).not.toBeNull();
    });

    it('does not render when variant is "dm"', () => {
      renderIsolated(<ChatList {...makeProps({ variant: "dm" })} />);
      expect(screen.queryByTestId("member-list-stub")).toBeNull();
    });

    it("does not render when the channel's own channel_type is dm/group_dm", () => {
      renderIsolated(
        <ChatList
          {...makeProps({ channel: makeChannel({ channel_type: "group_dm" }) })}
        />,
      );
      expect(screen.queryByTestId("member-list-stub")).toBeNull();
    });
  });

  it("isBanned passed down to ChatItem/ChatForm comes from the isMemberBanned SWR result, not a static value", async () => {
    vi.mocked(isMemberBanned).mockResolvedValue({
      success: true,
      data: true,
      message: "ok",
    });

    const m1 = makeMessage({ id: "m1" });
    renderIsolated(<ChatList {...makeProps({ historyMessages: [m1] })} />);

    await waitFor(() =>
      expect(screen.getByTestId("chat-form").getAttribute("data-banned")).toBe(
        "true",
      ),
    );
    expect(screen.getByTestId("chat-item").getAttribute("data-banned")).toBe(
      "true",
    );
  });

  it("isBanned reflects a false SWR result too, proving it isn't hardcoded", async () => {
    vi.mocked(isMemberBanned).mockResolvedValue({
      success: true,
      data: false,
      message: "ok",
    });

    const m1 = makeMessage({ id: "m1" });
    renderIsolated(<ChatList {...makeProps({ historyMessages: [m1] })} />);

    await waitFor(() =>
      expect(screen.getByTestId("chat-form").getAttribute("data-banned")).toBe(
        "false",
      ),
    );
    expect(screen.getByTestId("chat-item").getAttribute("data-banned")).toBe(
      "false",
    );
  });
});
