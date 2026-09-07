// components/sidebar/server/ServerSidebarWrapper.tsx
//
// Why (Smoke): identical shape to sidebar/SidebarWrapper.tsx, keyed on
// isChannelSidebarOpen/setChannelSidebarOpen instead of
// isSidebarOpen/setSidebarOpen.

import { describe, it } from "vitest";

describe("ServerSidebarWrapper", () => {
   it.todo(
      "backdrop overlay only renders when isChannelSidebarOpen; clicking it calls setChannelSidebarOpen(false)",
   );
   it.todo("pathname change auto-closes via the effect");
   it.todo("the sidebar's position class reflects isChannelSidebarOpen");
});
