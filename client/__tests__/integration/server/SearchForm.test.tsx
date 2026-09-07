// components/server/SearchForm.tsx
//
// Why: search submit with loading/error/results states, matchMedia-based
// mobile detection, click-outside-to-close.

import { describe, it } from "vitest";

describe("SearchForm", () => {
   it.todo("submitting an empty/whitespace query does not call searchMessage");
   it.todo(
      'submitting a query shows a loading spinner, then either results, "No messages found matching query.", or the error message',
   );
   it.todo(
      "clicking outside the search container (mousedown listener) closes the results dropdown, and on mobile also collapses isExpanded back to false",
   );
   it.todo(
      "on mobile (matchMedia mocked to matches:false), tapping the search icon while collapsed expands the input instead of submitting (e.preventDefault() branch) — on desktop it always submits",
   );
   it.todo(
      "clicking the clear (X) button resets the query, closes results, and refocuses the input (desktop) or collapses the bar (mobile)",
   );
});
