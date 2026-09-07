// components/server/Members.tsx
//
// Why: the highest-complexity component surveyed — kick/ban/unban
// destructive actions, role assign/remove via the already-tested
// useToggleRoleMember hook, dual search+role filtering, and
// useSWR({suspense:true}) which needs either a <Suspense> boundary in the
// test render or mocking around it.

import { describe, it } from "vitest";

describe("Members", () => {
   it.todo(
      "Suspense gotcha: hasKickMemberPerm/hasBanMemberPerm use { suspense: true } — wrap the render in <Suspense fallback={...}> or the component will throw a pending promise instead of rendering",
   );
   it.todo(
      'kick/ban dropdown items only appear when hasKickMemberPerm/hasBanMemberPerm are true, and never for the server owner (isOwner hides all destructive actions, shows "Server owner — role locked" instead)',
   );
   it.todo(
      "confirming a kick calls kickMember, then onMutate() + globalMutate(\"/api/members\") on success, or an error toast + dialog stays if it throws",
   );
   it.todo(
      "confirming a ban with a typed reason calls banMember(serverID, userId, reason) — same success/failure handling as kick",
   );
   it.todo(
      '"Unban" replaces "Ban" for an already-banned member; confirming calls unbanMember',
   );
   it.todo(
      "assigning/removing a role via the dropdown delegates to the already-unit-tested useToggleRoleMember/unassignRole — this test should assert the row disables/shows a spinner while pendingRoleId is set, not re-verify the hook's own internals",
   );
   it.todo(
      'search + role-pill filters combine (matchesQuery && matchesRole); "No role" pill toggles filtering to !m.role_id',
   );
});
