// components/server/profile.tsx
//
// Why: banner-gradient picker + icon upload + private-toggle + dirty-
// tracking save bar, same shape family as EditPerServerProfileDialog.tsx
// but for the server itself (different endpoint, worth its own coverage
// since a bug in one wouldn't be caught by the other's tests).

import { describe, it } from "vitest";

describe("ServerProfile", () => {
   it.todo(
      "getServerById result resets the form (name/icon/banner/description/private) on load",
   );
   it.todo(
      "selecting a gradient swatch sets banner and marks the form dirty; the preview panel reflects the selected gradient live",
   );
   it.todo(
      "attaching an icon file shows its preview + remove button; removing it resets the icon form field",
   );
   it.todo("submit only sends dirtyFields via updateServer's fields param");
   it.todo(
      "icon upload failure (uploaded.success === false) shows an error toast and aborts the submit before calling updateServer",
   );
   it.todo('toggling "Private profile" switch updates form state and marks dirty');
   it.todo(
      "save-bar states: unsaved / success (auto-clears after 3s, fake timers) / error (Retry/Reset)",
   );
});
