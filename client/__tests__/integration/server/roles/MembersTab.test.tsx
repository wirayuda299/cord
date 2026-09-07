// components/server/roles/members.tsx
//
// Why (Smoke): thin SWR + already-tested-hook wrapper — verify wiring, not
// the hook's own internals (covered in useToggleRole.test.ts).

import { describe, it } from "vitest";

describe("MembersTab", () => {
   it.todo(
      'loading spinner while isLoading; empty state ("No members have this role") when the list is empty',
   );
   it.todo(
      "each row's remove button is disabled while pendingRoleId is set (delegates to useToggleRoleMember)",
   );
});
