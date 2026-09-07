// components/server/roles/roles-settings.tsx
//
// Why: the view-router for the whole roles feature (list/create/detail/
// edit) — stub RoleList/RoleDetailView/RoleFormView to isolate this test
// to the navigation wiring itself, mirroring the ServerSettingDialog
// approach.

import { describe, it } from "vitest";

describe("RolesSettings", () => {
   it.todo(
      'selecting a role in the (stubbed) RoleList switches to "detail" view with that role',
   );
   it.todo(
      'onEdit from the detail view switches to "edit" with initialPermissions passed through correctly',
   );
   it.todo(
      'onBack from detail returns to "list" and clears selectedRole; onBack from edit returns to "detail" (not "list")',
   );
   it.todo(
      'onDeleted from detail returns to "list" and clears selectedRole (distinct from plain onBack)',
   );
   it.todo(
      "memberCounts passed to RoleList is correctly tallied per role_id from the members SWR data",
   );
});
