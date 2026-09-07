// components/direct-messages/ConversationListDrawer.tsx
//
// Why: representative of a 3-way repeated pattern (see
// sidebar/SidebarWrapper.tsx) — closes itself on route change via
// useEffect+usePathname, overlay-click-to-close, empty-state text.

import { describe, it } from "vitest";

describe("ConversationListDrawer", () => {
   it.todo('renders "No direct messages yet" when conversations is empty');
   it.todo(
      "renders each conversation with avatar image OR first-letter fallback depending on other_avatar_url",
   );
   it.todo(
      "clicking the backdrop overlay (only rendered when isChannelSidebarOpen) calls setChannelSidebarOpen(false)",
   );
   it.todo("navigating (pathname change) auto-closes the drawer via the useEffect");
});
