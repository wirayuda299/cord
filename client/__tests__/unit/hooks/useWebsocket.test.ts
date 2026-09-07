import { act, renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "@clerk/nextjs";
import { useWebSocket } from "@/hooks/useWebsocket";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Clerk needs a real <ClerkProvider> + network to work, neither of which
// exist in a test — fake the hook so we control token/userId per test.
vi.mock("@clerk/nextjs", () => ({
  useAuth: vi.fn(),
}));

// jsdom has no real network, so `new WebSocket(...)` never actually
// connects. This fake stands in for the browser API: it records what it
// was constructed/called with, and exposes trigger* helpers so tests can
// simulate the server opening the connection or pushing a message.
class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = FakeWebSocket.CONNECTING;
  onopen: ((e: Event) => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  sentMessages: string[] = [];
  closedWith: [number | undefined, string | undefined] | null = null;

  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string) {
    this.readyState = FakeWebSocket.CLOSED;
    this.closedWith = [code, reason];
  }

  triggerOpen() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.(new Event("open"));
  }

  triggerMessage(data: string) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

function mockAuth(token: string | null, userId = "user_1") {
  vi.mocked(useAuth).mockReturnValue({
    getToken: vi.fn().mockResolvedValue(token),
    userId,
  } as never);
}

beforeEach(() => {
  FakeWebSocket.instances = [];
  vi.stubGlobal("WebSocket", FakeWebSocket);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useWebSocket", () => {
  it("opens a WebSocket to the ws url with serverId/channelId/token once getToken resolves", async () => {
    mockAuth("tok123");

    const { result } = renderHook(() =>
      useWebSocket("srv1", "chan1", { onMessage: vi.fn() }),
    );

    // status flips to "connecting" synchronously, before getToken resolves
    expect(result.current.status).toBe("connecting");

    await waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1));

    expect(FakeWebSocket.instances[0].url).toBe(
      "ws://localhost:8080/ws?serverId=srv1&channelId=chan1&token=tok123",
    );
    expect(result.current.status).toBe("connecting"); // still, until onopen fires

    act(() => {
      FakeWebSocket.instances[0].triggerOpen();
    });

    expect(result.current.status).toBe("connected");
  });

  it("sets status to error and never opens a socket when getToken returns no token", async () => {
    mockAuth(null);

    const { result } = renderHook(() =>
      useWebSocket("srv1", "chan1", { onMessage: vi.fn() }),
    );

    await waitFor(() => expect(result.current.status).toBe("error"));

    expect(FakeWebSocket.instances).toHaveLength(0);
  });

  it("routes incoming messages: plain payloads to onMessage, message_deleted to onDelete, other typed events to onEvent", async () => {
    mockAuth("tok123");
    const onMessage = vi.fn();
    const onDelete = vi.fn();
    const onEvent = vi.fn();

    renderHook(() =>
      useWebSocket("srv1", "chan1", { onMessage, onDelete, onEvent }),
    );

    await waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1));
    const ws = FakeWebSocket.instances[0];

    act(() => {
      ws.triggerMessage(
        [
          JSON.stringify({ text: "hi" }),
          JSON.stringify({ type: "message_deleted", id: "m1" }),
          JSON.stringify({ type: "reaction_added", foo: "bar" }),
        ].join("\n"),
      );
    });

    expect(onMessage).toHaveBeenCalledWith({ text: "hi" });
    expect(onDelete).toHaveBeenCalledWith("m1");
    expect(onEvent).toHaveBeenCalledWith({ type: "reaction_added", foo: "bar" });
  });

  it("sendMessage returns false before the socket is open, true (and sends JSON) once open", async () => {
    mockAuth("tok123");

    const { result } = renderHook(() =>
      useWebSocket("srv1", "chan1", { onMessage: vi.fn() }),
    );

    await waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1));
    const ws = FakeWebSocket.instances[0];

    expect(result.current.sendMessage({ hello: "world" })).toBe(false);

    act(() => {
      ws.triggerOpen();
    });

    expect(result.current.sendMessage({ hello: "world" })).toBe(true);
    expect(ws.sentMessages).toEqual([JSON.stringify({ hello: "world" })]);
  });

  it("closes the socket with code 1000 'cleanup' on unmount", async () => {
    mockAuth("tok123");

    const { unmount } = renderHook(() =>
      useWebSocket("srv1", "chan1", { onMessage: vi.fn() }),
    );

    await waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1));
    const ws = FakeWebSocket.instances[0];
    act(() => ws.triggerOpen());

    unmount();

    expect(ws.closedWith).toEqual([1000, "cleanup"]);
  });
});
