// components/sidebar/SidebarWrapper.tsx
//
// Why (Full — representative): closes itself on route change and toggles
// an overlay+slide-in drawer from a store-boolean pattern also shared with
// direct-messages/ConversationListDrawer.tsx and
// sidebar/server/ServerSidebarWrapper.tsx.

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SidebarWrapper from "@/components/sidebar/SidebarWrapper";
import { useAppStore } from "@/stores/store";

afterEach(() => {
   cleanup();
});

let pathname = "/servers/1";
const usePathnameMock = vi.fn(() => pathname);
vi.mock("next/navigation", () => ({
   usePathname: () => usePathnameMock(),
}));

beforeEach(() => {
   pathname = "/servers/1";
   usePathnameMock.mockClear();
   useAppStore.setState({ isSidebarOpen: false });
});

describe("SidebarWrapper", () => {
   it("backdrop overlay only renders when isSidebarOpen; clicking it calls setSidebarOpen(false)", () => {
      const { container, rerender } = render(
         <SidebarWrapper>content</SidebarWrapper>,
      );

      expect(container.querySelector(".fixed.inset-0")).toBeNull();

      useAppStore.setState({ isSidebarOpen: true });
      rerender(<SidebarWrapper>content</SidebarWrapper>);

      const overlay = container.querySelector(".fixed.inset-0");
      expect(overlay).not.toBeNull();

      fireEvent.click(overlay as Element);

      expect(useAppStore.getState().isSidebarOpen).toBe(false);
   });

   it("pathname change (mock usePathname to return a new value on rerender) calls setSidebarOpen(false) via the effect", () => {
      const { rerender } = render(<SidebarWrapper>content</SidebarWrapper>);

      // opened after mount, e.g. by a nav toggle button elsewhere
      useAppStore.setState({ isSidebarOpen: true });
      expect(useAppStore.getState().isSidebarOpen).toBe(true);

      pathname = "/servers/2";
      rerender(<SidebarWrapper>content</SidebarWrapper>);

      expect(useAppStore.getState().isSidebarOpen).toBe(false);
   });

   it("the sidebar's position class reflects isSidebarOpen (left-0 vs -left-full)", () => {
      const { container, rerender } = render(
         <SidebarWrapper>content</SidebarWrapper>,
      );

      const panel = container.querySelector(".fixed.inset-y-0") as Element;
      expect(panel.className).toContain("-left-full");
      expect(panel.className).not.toContain(" left-0");

      useAppStore.setState({ isSidebarOpen: true });
      rerender(<SidebarWrapper>content</SidebarWrapper>);

      const panelOpen = container.querySelector(".fixed.inset-y-0") as Element;
      expect(panelOpen.className).toContain("left-0");
      expect(panelOpen.className).not.toContain("-left-full");
   });
});
