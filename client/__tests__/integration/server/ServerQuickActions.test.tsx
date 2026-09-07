// components/server/ServerQuickActions.tsx
//
// Why: reuse-existing-vs-create-new invite logic, copy-with-timed-feedback,
// conditional "Start Chatting" card.

import { describe, it } from "vitest";

describe("ServerQuickActions", () => {
   it.todo(
      "on mount, if getAllInvitation returns an invite with uses < max_users, that invite's link is reused — createInvitationCode is NOT called in that case",
   );
   it.todo(
      "if no reusable invite exists, createInvitationCode is called and its result becomes the link (handle both the string and nested {data:{code}} shapes, same as members/FriendList.tsx)",
   );
   it.todo(
      "either getAllInvitation or createInvitationCode failing sets linkError and shows it instead of the link",
   );
   it.todo(
      'copy button is disabled until a link exists; clicking it shows "Copied!" for 2s (fake timers)',
   );
   it.todo(
      'firstChannelId present renders the "Start Chatting" link card; absent renders the "No Channels Found" inactive card instead',
   );
});
