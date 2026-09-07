// components/server/CreateChannel.tsx
//
// Why: channel-type picker selection state, name-field validation
// (min:3, max:20), success/error toast + reset. Pulls categoryID from the
// Zustand store rather than a form field.
//
// See also EditChannelDialog.test.tsx — same shape, edit mode instead of
// create (type picker becomes read-only, pre-filled from the channel prop,
// no form reset after success).

import { describe, it } from "vitest";

describe("CreateChannel", () => {
   it.todo(
      "selecting a channel type highlights it (setValue(\"type\", ...)) and the initial submit is blocked until a type is chosen (no default selected)",
   );
   it.todo(
      "name shorter than 3 or longer than 20 chars shows a field error and blocks submit",
   );
   it.todo(
      "successful create shows a toast and resets the form; failure shows the error toast, form stays filled",
   );
   it.todo(
      "categoryID sent to createChannel comes from useAppStore's selectedCategory, not a form field",
   );
});
