// components/server/CreateServerForm.tsx
//
// Why: combines the already-unit-tested useAttachedFiles hook with a real
// form submit — good "wiring" test between two previously-isolated pieces.

import { describe, it } from "vitest";

describe("CreateServerForm", () => {
   it.todo(
      "handleSubmit no-ops on an empty/whitespace-only name (never calls createServer)",
   );
   it.todo(
      "successful createServer shows a success toast (dialog does not auto-close — confirm current behavior is intentional)",
   );
   it.todo(
      "createServer returning {success:false} shows the error toast with res.message",
   );
   it.todo(
      "dropping/selecting a file shows the icon preview (attachedFiles[0].preview) instead of the upload placeholder",
   );
   it.todo("drag-over/drag-leave toggles the dashed-border \"drop here\" visual state");
});
