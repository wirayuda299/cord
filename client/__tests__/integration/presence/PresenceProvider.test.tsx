// components/presence/PresenceProvider.tsx
//
// Why: this is the actual event router for the app-wide presence socket —
// pure onEvent branching logic, same fake-WebSocket pattern as
// hooks/useWebsocket.test.ts, high real-world value (drives online
// indicators + forced-logout-from-kicked-server flow).

import { describe, it } from "vitest";

describe("PresenceProvider", () => {
   it.todo('{type:"user_list", user_ids} calls setOnlineUserIds(user_ids)');
   it.todo(
      '{type:"user_status", action:"connected", user_id} calls addOnlineUser; action:"disconnected" calls removeOnlineUser',
   );
   it.todo(
      '{type:"removed_from_server", server_id, reason} when pathname starts with `/${server_id}`: shows a "banned"/"kicked" toast matching reason, and calls router.push("/direct-messages"); when NOT currently in that server\'s path, just calls router.refresh() without the toast/redirect',
   );
   it.todo(
      '{type:"friend_accepted"} calls both router.refresh() and globalMutate("/api/friends")',
   );
   it.todo(
      "component renders null (no visible UI) — no DOM assertions needed, only mock-call assertions",
   );
});
