// components/server/Invites.tsx
//
// Why: create-invite form toggle with clamped/preset max-uses input,
// delete with success/error toast, list-vs-empty-state.

import { describe, it } from "vitest";

describe("Invites", () => {
   it.todo(
      "clicking \"Create Invite\" toggles the inline CreateInviteForm; clicking a preset (5/10/25/50/100) sets maxUsers; typing a raw number clamps to [1,255]",
   );
   it.todo(
      "\"Generate Link\" calls createInvitationCode(serverID, maxUsers), shows success/error toast, and always closes the create form afterward (even on error — check setCreating(false) runs in both branches)",
   );
   it.todo(
      "deleting an invite calls deleteInvitationCode, shows a success toast, or an error toast if it throws",
   );
   it.todo(
      'empty state ("No invite links yet") only shows when data.length === 0 && !creating',
   );
   it.todo(
      'UsageBar/InviteRow mark an invite "Full" (red styling + badge) when uses >= max_users',
   );
});
