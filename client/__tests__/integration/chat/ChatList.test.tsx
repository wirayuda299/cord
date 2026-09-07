// components/chat/ChatList.tsx
//
// Why: real websocket message merge/dedup logic, reaction toggle state,
// permission/ban-gated rendering — needs useWebSocket mocked the same way
// hooks/useWebsocket.test.ts already mocks it (fake WebSocket class).

import { describe, it } from "vitest";

describe("ChatList", () => {
   it.todo(
      "handleMessages filters incoming messages by thread_id vs channel_id, merges into existing list by id (update-in-place), and appends genuinely new ones in order",
   );
   it.todo(
      "handleToggleReaction (passed to ChatItem as onToggleReaction) adds a reaction if the current user hasn't reacted with that emoji yet, removes it if they have",
   );
   it.todo(
      "handleDelete removes a message from local state entirely (mirrors websocket onDelete)",
   );
   it.todo("MemberList only renders when !isDirectMessage");
   it.todo(
      "isBanned prop passed down to ChatItem/ChatForm comes from the isMemberBanned SWR call, not a static value",
   );
});
