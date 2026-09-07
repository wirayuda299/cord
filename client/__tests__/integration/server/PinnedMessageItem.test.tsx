// components/server/PinnedMessageItem.tsx
//
// Why: delete-pin success/error toast, canDelete permission gate on the
// delete button's visibility.

import { describe, it } from "vitest";

describe("PinnedMessageItem", () => {
   it.todo("delete button (X) only renders per-item when canDelete is true");
   it.todo(
      "clicking delete calls deletePinnedMessage(id, serverId), shows success or error toast based on res.success, and e.stopPropagation() prevents the row's own click handler (jump-to-message) from also firing",
   );
   it.todo(
      "clicking a pinned item without a matching DOM id present calls console.warn and does not throw (the \"not found\" branch in handleJumpToMessage)",
   );
});
