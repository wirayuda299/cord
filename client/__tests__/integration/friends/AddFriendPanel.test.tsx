// components/friends/AddFriendPanel.tsx
//
// Why: debounced search with a 3-char minimum gate, SWR mutation with
// optimistic local update, per-row sending/disabled state machine.

import { describe, it } from "vitest";

describe("AddFriendPanel", () => {
   it.todo(
      'typing under 3 characters shows the "must be at least 3 characters" hint and does NOT trigger findUsersByName (debounce + shouldSearch gate — use fake timers for the 300ms debounce)',
   );
   it.todo(
      'typing 3+ characters (after debounce) calls findUsersByName, shows "Searching users..." while in flight, "No users found." when the result is empty',
   );
   it.todo(
      'clicking "Send request" on a user with friend_status === "" calls sendFriendRequest, shows success/error toast, and optimistically patches that user\'s friend_status to "pending" via mutate without a full revalidate',
   );
   it.todo(
      'button is disabled and shows "Sent"/"Friends"/"Blocked" for friend_status of pending/accepted/blocked respectively, and clicking does nothing (user.friend_status !== "" early return)',
   );
   it.todo(
      "only one request can be in flight at a time (sendingId guard) — second click while sending is a no-op",
   );
});
