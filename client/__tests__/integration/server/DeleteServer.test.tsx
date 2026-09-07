// components/server/DeleteServer.tsx
//
// Why: a destructive-action confirmation gate — exact-name-match
// requirement before the delete button becomes enabled. High value: a bug
// here silently makes server deletion too easy or impossible.

import { describe, it } from "vitest";

describe("DeleteServer", () => {
   it.todo(
      "the submit button stays disabled until confirmName exactly matches serverName (trimmed) — typing a near-match (extra space, wrong case) keeps it disabled",
   );
   it.todo("submitting while not matched is a no-op (form submit guarded by isMatched)");
   it.todo(
      'successful delete calls router.push("/direct-messages") then router.refresh()',
   );
   it.todo(
      "deleteServer returning {success:false} shows the inline error message and re-enables the form (stays on loading=false)",
   );
   it.todo("the input and submit button are disabled while loading=true");
});
