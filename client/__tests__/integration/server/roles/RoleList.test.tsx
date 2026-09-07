// components/server/roles/list.tsx
//
// Why (Smoke): loading/empty/data states plus selection highlighting —
// simpler shape than RoleFormView/RoleDetailView.

import { describe, it } from "vitest";

describe("RoleList", () => {
   it.todo('loading skeleton while isLoading; "No roles yet." when the resolved list is empty');
   it.todo(
      "clicking a role calls onSelect(id, role); the currently selectedId role is visually marked (aria-current)",
   );
   it.todo('clicking "Create Role" calls both onCreateClick() and mutate()');
});
