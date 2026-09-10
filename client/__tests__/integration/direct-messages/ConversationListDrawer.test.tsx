// components/direct-messages/ConversationListDrawer.tsx
//
// Why: representative of a 3-way repeated pattern (see
// sidebar/SidebarWrapper.tsx) — closes itself on route change via
// useEffect+usePathname, overlay-click-to-close, empty-state text.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ConversationListDrawer from "@/components/direct-messages/ConversationListDrawer";
import { useAppStore } from "@/stores/store";
import type { Conversation } from "@/types/conversation";

afterEach(() => {
   cleanup();
});

let pathname = "/direct-messages";
const usePathnameMock = vi.fn(() => pathname);
vi.mock("next/navigation", () => ({
   usePathname: () => usePathnameMock(),
}));

beforeEach(() => {
   pathname = "/direct-messages";
   usePathnameMock.mockClear();
   useAppStore.setState({ isChannelSidebarOpen: false });
});

function conversation(overrides: Partial<Conversation>): Conversation {
   return {
      channel_id: "chan-1",
      channel_type: "dm",
      name: "Alice",
      other_user_id: "user-2",
      other_username: "alice",
      other_avatar_url: "",
      last_message_content: "",
      last_message_at: "2026-01-01T00:00:00Z",
      ...overrides,
   };
}

describe("ConversationListDrawer", () => {
   it('renders "No direct messages yet" when conversations is empty', () => {
      render(<ConversationListDrawer conversations={[]} />);

      expect(screen.getByText("No direct messages yet")).not.toBeNull();
   });

   it("renders each conversation with avatar image OR first-letter fallback depending on other_avatar_url", () => {
      render(
         <ConversationListDrawer
            conversations={[
               conversation({
                  channel_id: "chan-with-avatar",
                  name: "Bob",
                  other_avatar_url: "https://i.pravatar.cc/150?img=1",
               }),
               conversation({
                  channel_id: "chan-without-avatar",
                  name: "Carol",
                  other_avatar_url: "",
               }),
            ]}
         />,
      );

      expect(screen.getByText("Bob")).not.toBeNull();
      expect(screen.getByAltText("Bob")).not.toBeNull();

      expect(screen.getByText("Carol")).not.toBeNull();
      expect(screen.queryByAltText("Carol")).toBeNull();
      expect(screen.getByText("C")).not.toBeNull();
   });

   it("clicking the backdrop overlay (only rendered when isChannelSidebarOpen) calls setChannelSidebarOpen(false)", () => {
      useAppStore.setState({ isChannelSidebarOpen: false });
      const { container, rerender } = render(
         <ConversationListDrawer conversations={[]} />,
      );

      // not rendered while the drawer is closed
      expect(container.querySelector(".fixed.inset-0")).toBeNull();

      useAppStore.setState({ isChannelSidebarOpen: true });
      rerender(<ConversationListDrawer conversations={[]} />);

      const overlay = container.querySelector(".fixed.inset-0");
      expect(overlay).not.toBeNull();

      fireEvent.click(overlay as Element);

      expect(useAppStore.getState().isChannelSidebarOpen).toBe(false);
   });

   it("navigating (pathname change) auto-closes the drawer via the useEffect", () => {
      const { rerender } = render(<ConversationListDrawer conversations={[]} />);

      // opened after mount (e.g. by the mobile nav toggle) — not by the
      // effect that ran on initial mount
      useAppStore.setState({ isChannelSidebarOpen: true });
      expect(useAppStore.getState().isChannelSidebarOpen).toBe(true);

      // simulate navigation: usePathname now returns a new value
      pathname = "/direct-messages/chan-1";
      rerender(<ConversationListDrawer conversations={[]} />);

      expect(useAppStore.getState().isChannelSidebarOpen).toBe(false);
   });
});
