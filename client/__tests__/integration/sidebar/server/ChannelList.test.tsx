// components/sidebar/server/ChannelList.tsx
//
// Why (Smoke): category expand/collapse via the shared Zustand
// selectedCategory, permission-gated edit-channel trigger.

import { describe, it } from "vitest";

describe("ChannelList (sidebar)", () => {
   it.todo(
      "clicking a category header toggles its channel list open/closed via chooseCategory; clicking the already-open category closes it (category?.id === cat.id ? null : cat)",
   );
   it.todo(
      "the per-channel settings gear (opens EditChannelDialog) only renders when hasPerm is true",
   );
});
