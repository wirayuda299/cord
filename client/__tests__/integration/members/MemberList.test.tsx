// components/members/MemberList.tsx
//
// Why: conditional SWR key (isOpen ? "/api/members" : null), online-count
// computation, owner-role-badge suppression.

import { describe, it } from "vitest";

describe("MemberList", () => {
   it.todo(
      "when isOpen=false, the SWR key is null — apiFetcher is never called (verify no fetch happens until opened)",
   );
   it.todo(
      'error -> "Failed to load members"; isLoading -> spinner; success -> member rows',
   );
   it.todo(
      '"Online — N" label count only counts members whose user_id is in onlineIds',
   );
   it.todo(
      "a member's role label is suppressed when isOwner is true, even if member.role is set",
   );
});
