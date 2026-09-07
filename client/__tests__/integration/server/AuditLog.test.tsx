// components/server/AuditLog.tsx
//
// Why: full loading/error/empty/data state machine, query+category
// filtering, date-grouping, per-row expand/collapse gated on whether the
// entry actually has changes.

import { describe, it } from "vitest";

describe("AuditLog", () => {
   it.todo(
      "getAuditLogs success maps raw entries (category inference via mapActionTypeToCategory's prefix rules) and groups them by dateLabel (\"Today\"/\"Yesterday\"/weekday)",
   );
   it.todo(
      '!success or thrown error -> the "Couldn\'t load the audit log" empty state',
   );
   it.todo(
      "typing in the search box filters by actor.name (case-insensitive); category pills filter by category; both apply together",
   );
   it.todo(
      "an entry row is only clickable/expandable when hasChanges (entry.changes?.length > 0) — clicking a row with no changes does nothing",
   );
   it.todo(
      "expanding a row with changes renders each ChangeRow (before -> after diff)",
   );
   it.todo(
      'header count text ("{filtered} of {total} actions") updates as filters change, and is hidden while status === "loading"',
   );
});
