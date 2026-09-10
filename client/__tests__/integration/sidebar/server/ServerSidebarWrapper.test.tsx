// components/sidebar/server/ServerSidebarWrapper.tsx
//
// Why (Smoke): identical shape to sidebar/SidebarWrapper.tsx, keyed on
// isChannelSidebarOpen/setChannelSidebarOpen instead of
// isSidebarOpen/setSidebarOpen.

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ServerSidebarWrapper from "@/components/sidebar/server/ServerSidebarWrapper";
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
   useAppStore.setState({ isChannelSidebarOpen: false });
});

describe("ServerSidebarWrapper", () => {
   it("backdrop overlay only renders when isChannelSidebarOpen; clicking it calls setChannelSidebarOpen(false)", () => {
      const { container, rerender } = render(
         <ServerSidebarWrapper>content</ServerSidebarWrapper>,
      );

      expect(container.querySelector(".fixed.inset-0")).toBeNull();

      useAppStore.setState({ isChannelSidebarOpen: true });
      rerender(<ServerSidebarWrapper>content</ServerSidebarWrapper>);

      const overlay = container.querySelector(".fixed.inset-0");
      expect(overlay).not.toBeNull();

      fireEvent.click(overlay as Element);

      expect(useAppStore.getState().isChannelSidebarOpen).toBe(false);
   });

   it("pathname change auto-closes via the effect", () => {
      const { rerender } = render(<ServerSidebarWrapper>content</ServerSidebarWrapper>);

      useAppStore.setState({ isChannelSidebarOpen: true });
      expect(useAppStore.getState().isChannelSidebarOpen).toBe(true);

      pathname = "/servers/1/chan-2";
      rerender(<ServerSidebarWrapper>content</ServerSidebarWrapper>);

      expect(useAppStore.getState().isChannelSidebarOpen).toBe(false);
   });

   it("the sidebar's position class reflects isChannelSidebarOpen", () => {
      const { container, rerender } = render(
         <ServerSidebarWrapper>content</ServerSidebarWrapper>,
      );

      const panel = container.querySelector(".fixed.inset-y-0") as Element;
      expect(panel.className).toContain("-left-full");
      expect(panel.className).not.toContain("left-0");

      useAppStore.setState({ isChannelSidebarOpen: true });
      rerender(<ServerSidebarWrapper>content</ServerSidebarWrapper>);

      const panelOpen = container.querySelector(".fixed.inset-y-0") as Element;
      expect(panelOpen.className).toContain("left-0");
      expect(panelOpen.className).not.toContain("-left-full");
   });
});
