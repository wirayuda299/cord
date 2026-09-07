// components/server/EditPerServerProfileDialog.tsx
//
// Why: dirty-field-only patch construction, avatar upload tied into form
// state, save-bar state machine with auto-clearing success toast (fake
// timers).

import { describe, it } from "vitest";

describe("EditPerServerProfileDialog", () => {
   it.todo(
      "on load, getServerProfile result populates the form via form.reset — form starts non-dirty",
   );
   it.todo("the save bar is hidden until isDirty or submitStatus is set");
   it.todo(
      "only dirtyFields are included in the patch sent to updateServerProfile (changing only bio must not send username)",
   );
   it.todo(
      "attaching a file uploads it via uploadImage on submit and includes avatar/avatar_asset_id in the patch; removing the attached file resets the avatar form field",
   );
   it.todo(
      'updateServerProfile failure shows the save-bar error state with Retry/Reset; success shows "Saved successfully!" then auto-clears after 3s (fake timers)',
   );
   it.todo(
      "character counters for username (32) and bio (190) turn yellow past their warning thresholds (28/170)",
   );
});
