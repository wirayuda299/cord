// components/server/EditChannelDialog.tsx
//
// Why: same shape family as CreateChannel.tsx, but the channel-type picker
// becomes read-only (edit can't change type) — a real behavioral
// difference worth its own quick check, not identical shape.

import { describe, it } from "vitest";

describe("EditChannelDialog", () => {
   it.todo("form is pre-filled with channel.name/channel.topic");
   it.todo(
      "the channel-type list is entirely aria-disabled/cursor-not-allowed — clicking a different type never changes selection",
   );
   it.todo(
      "successful update shows a toast (no reset — unlike create, the dialog doesn't clear the form after success)",
   );
});
