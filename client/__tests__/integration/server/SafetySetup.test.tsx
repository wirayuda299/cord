// components/server/SafetySetup.tsx
//
// Why: loads defaults via the already-unit-tested getSafetySetup,
// radio-card + toggle-row state, live summary card, submit success/error.

import { describe, it } from "vitest";

describe("SafetySetup", () => {
   it.todo(
      "on mount, a successful getSafetySetup call resets the form to the fetched values (verification level, content filter, 2FA, DM spam filter, notifications)",
   );
   it.todo(
      "an error result from getSafetySetup leaves the form at DEFAULT_VALUES (doesn't call reset)",
   );
   it.todo(
      'selecting a different verification-level/content-filter/notification OptionCard updates the "Current Configuration" summary card live',
   );
   it.todo(
      '"Require 2FA"/"DM Spam Filter" switches update both the toggle and the summary',
   );
   it.todo(
      'successful submit calls updateSafetySetup, shows "Safety settings saved!", auto-clears after 3s (fake timers); failure shows the error message and keeps the form dirty',
   );
});
