// components/friends/FriendsList.tsx
//
// Why: filter="online" vs "all" changes both the visible list and the
// empty-state copy, based on the Zustand onlineUserIds set.

import { describe, it } from "vitest";

describe("FriendsList", () => {
   it.todo(
   'filter="online" shows only friends whose user_id is in onlineUserIds; filter="all" (default) shows everyone',
   );
   it.todo(
      'empty state text differs: "No friends online" vs "No friend yet" depending on filter',
   );
   it.todo(
      "each row's online/offline indicator and \"Online\"/\"Offline\" label reflect onlineUserIds.has(user_id)",
   );
   it.todo(
      "the \"message\" button is a <form action={startConversation}> — mock startConversation and confirm submitting the form (fireEvent.submit) invokes it with the hidden targeted_user_id field",
   );
});
