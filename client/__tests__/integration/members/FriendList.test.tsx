// components/members/FriendList.tsx
//
// Why: invite-link generation on mount with a cancellation guard, search
// filter, copy-with-timed-reset feedback (needs fake timers).

import { describe, it } from "vitest";

describe("FriendList (members)", () => {
   it.todo(
      "on mount, calls createInvitationCode, and on success sets inviteLink to `${origin}/invite/${code}` — test both the plain-string and nested {data:{code}} response shapes it handles",
   );
   it.todo(
      "createInvitationCode returning {success:false} sets linkError and shows that message instead of the link",
   );
   it.todo(
      "unmounting before the invite-link promise resolves must not call setInviteLink/setLinkError (the cancelled guard — a console-error-free unmount during a pending promise is the proxy check)",
   );
   it.todo(
      "typing in search filters the friends list by username (case-insensitive includes)",
   );
   it.todo(
      'empty state differs: "No friends yet" (no friends at all) vs "No matching friends" (search excluded everyone)',
   );
   it.todo(
      'clicking "Copy link" on a row calls copyText, shows "Copied" for 1.5s then reverts (fake timers), and the copy button is disabled until inviteLink exists',
   );
});
