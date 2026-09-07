// components/server/roles/role-detail-view.tsx
//
// Why: tab switching (display/permissions/members — stub MembersTab to
// isolate), and a real destructive-action confirm state machine for role
// deletion.

import { describe, it } from "vitest";

describe("RoleDetailView", () => {
   it.todo(
      'clicking a tab switches activeTab and renders the matching content; "permissions" tab shows a skeleton while isLoading',
   );
   it.todo(
      'clicking "Delete Role" moves to deleteState:"confirm"; clicking "Confirm" calls deleteRole, and on success calls onDeleted?.() ?? onBack(); on thrown error moves to deleteState:"error" with the message shown and a "Dismiss" back to idle',
   );
   it.todo(
      "clicking \"Edit Role\" calls onEdit(data?.permissions ?? []) — passing through the currently-loaded permission set, not an empty array, once loaded",
   );
   it.todo(
      '"Back to Roles" always calls onBack() regardless of activeTab/deleteState',
   );
});
