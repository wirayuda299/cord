// components/presence/PresenceProvider.tsx
//
// Why: this is the actual event router for the app-wide presence socket —
// pure onEvent branching logic, same fake-WebSocket pattern as
// hooks/useWebsocket.test.ts, high real-world value (drives online
// indicators + forced-logout-from-kicked-server flow).

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mutate as globalMutate } from "swr";
import PresenceProvider from "@/components/presence/PresenceProvider";
import { toast } from "@/components/ui/toast";
import { useAppStore } from "@/stores/store";

afterEach(() => {
   cleanup();
});

// PresenceProvider passes { onMessage, onEvent } into useWebSocket — the hook
// itself (reconnect logic, real WebSocket, JSON parsing) is covered
// separately; here we only care that PresenceProvider wires the right store
// actions/router calls to the onEvent branch it owns, so the hook is
// replaced with a stub that just captures the options it was given.
let capturedOnEvent: ((ev: unknown) => void) | undefined;
vi.mock("@/hooks/useWebsocket", () => ({
   useWebSocket: vi.fn((_serverId: string, _channelId: string, options: { onEvent?: (ev: unknown) => void }) => {
      capturedOnEvent = options.onEvent;
      return { sendMessage: vi.fn(), status: "connected" };
   }),
}));

vi.mock("@/components/ui/toast", () => ({
   toast: { add: vi.fn() },
}));

const pushMock = vi.fn();
const refreshMock = vi.fn();
let pathname = "/direct-messages";
vi.mock("next/navigation", () => ({
   useRouter: () => ({ push: pushMock, refresh: refreshMock }),
   usePathname: () => pathname,
}));

vi.mock("swr", () => ({
   mutate: vi.fn(),
}));

beforeEach(() => {
   pathname = "/direct-messages";
   capturedOnEvent = undefined;
   useAppStore.setState({ onlineUserIds: new Set() });
});

describe("PresenceProvider", () => {
   it('{type:"user_list", user_ids} calls setOnlineUserIds(user_ids)', () => {
      render(<PresenceProvider />);

      act(() => {
         capturedOnEvent?.({ type: "user_list", user_ids: ["u1", "u2"] });
      });

      expect(useAppStore.getState().onlineUserIds).toEqual(new Set(["u1", "u2"]));
   });

   it('{type:"user_status", action:"connected"} calls addOnlineUser; action:"disconnected" calls removeOnlineUser', () => {
      render(<PresenceProvider />);

      act(() => {
         capturedOnEvent?.({ type: "user_status", action: "connected", user_id: "u1" });
      });
      expect(useAppStore.getState().onlineUserIds.has("u1")).toBe(true);

      act(() => {
         capturedOnEvent?.({ type: "user_status", action: "disconnected", user_id: "u1" });
      });
      expect(useAppStore.getState().onlineUserIds.has("u1")).toBe(false);
   });

   it('{type:"removed_from_server"} inside that server\'s path shows a "banned" toast and redirects', () => {
      pathname = "/server-1/channels/general";
      render(<PresenceProvider />);

      act(() => {
         capturedOnEvent?.({ type: "removed_from_server", server_id: "server-1", reason: "banned" });
      });

      expect(toast.add).toHaveBeenCalledWith({
         title: "You were banned from this server.",
         type: "warning",
      });
      expect(pushMock).toHaveBeenCalledWith("/direct-messages");
      expect(refreshMock).toHaveBeenCalled();
   });

   it('{type:"removed_from_server"} with reason "kicked" shows the kicked-specific message', () => {
      pathname = "/server-1/channels/general";
      render(<PresenceProvider />);

      act(() => {
         capturedOnEvent?.({ type: "removed_from_server", server_id: "server-1", reason: "kicked" });
      });

      expect(toast.add).toHaveBeenCalledWith({
         title: "You were kicked from this server.",
         type: "warning",
      });
   });

   it('{type:"removed_from_server"} NOT in that server\'s path just calls router.refresh(), no toast/redirect', () => {
      pathname = "/server-2/channels/general";
      render(<PresenceProvider />);

      act(() => {
         capturedOnEvent?.({ type: "removed_from_server", server_id: "server-1", reason: "banned" });
      });

      expect(toast.add).not.toHaveBeenCalled();
      expect(pushMock).not.toHaveBeenCalled();
      expect(refreshMock).toHaveBeenCalled();
   });

   it('{type:"friend_accepted"} calls both router.refresh() and globalMutate("/api/friends")', () => {
      render(<PresenceProvider />);

      act(() => {
         capturedOnEvent?.({ type: "friend_accepted" });
      });

      expect(refreshMock).toHaveBeenCalled();
      expect(globalMutate).toHaveBeenCalledWith("/api/friends");
   });

   it("renders null (no visible UI)", () => {
      const { container } = render(<PresenceProvider />);
      expect(container.firstChild).toBeNull();
   });
});
