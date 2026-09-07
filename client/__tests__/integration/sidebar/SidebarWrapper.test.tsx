// components/sidebar/SidebarWrapper.tsx
//
// Why (Full — representative): closes itself on route change and toggles
// an overlay+slide-in drawer from a store-boolean pattern also shared with
// direct-messages/ConversationListDrawer.tsx and
// sidebar/server/ServerSidebarWrapper.tsx.

import { describe, it } from "vitest";

describe("SidebarWrapper", () => {
   it.todo(
      "backdrop overlay only renders when isSidebarOpen; clicking it calls setSidebarOpen(false)",
   );
   it.todo(
      "pathname change (mock usePathname to return a new value on rerender) calls setSidebarOpen(false) via the effect",
   );
   it.todo(
      "the sidebar's position class reflects isSidebarOpen (left-0 vs -left-full)",
   );
});
