// components/server/roles/role-form-view.tsx
//
// Why: the most important single component in the roles feature — dual
// create/edit mode, permission-array toggling, dirty-field-only patch on
// edit, validation.

import { describe, it } from "vitest";

describe("RoleFormView", () => {
   it.todo(
      'mode="create": submitting calls createRole; success shows a toast, resets the form, and calls onBack(); failure shows an inline error and stays open',
   );
   it.todo(
      'mode="edit": only dirtyFields are included in the updateRole payload (e.g. only toggling hoist must not send name)',
   );
   it.todo(
      "name field validation (min(1)/max(50)) blocks submit and shows the zod error message",
   );
   it.todo(
      "clicking a ROLE_COLORS swatch sets role_color and marks the form dirty; the header icon/color preview reflects it live",
   );
   it.todo(
      "toggling a permission row (togglePermission) adds/removes it from the permissions array — clicking the row and clicking the inner Switch must not double-toggle (verify the stopPropagation on the switch wrapper actually works)",
   );
   it.todo(
      "edit mode footer is <SaveBar> (dirty/success/error states); create mode footer is explicit Cancel/Create buttons with isSubmitting disabling",
   );
});
