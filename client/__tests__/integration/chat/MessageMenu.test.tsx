// components/chat/MessageMenu.tsx
//
// Why: the actual menu-item-list logic (permissions/ownership/banned gating
// per item) lives here, not in ChatItem — ChatItem.test.tsx currently stubs
// this component entirely per its own TODO note, so this is genuinely
// untested.

import { describe, it } from "vitest";

describe("MessageMenu", () => {
   it.todo(
      "\"Edit Message\" only appears when !isBanned && userId === message.user_id && onEdit is truthy",
   );
   it.todo(
      "\"Create Thread\" only appears when !isBanned && hasPermissionManageMessages",
   );
   it.todo(
      "\"Delete Message\" appears when message.user_id === userId || hasPermissionManageMessages (not just ownership)",
   );
   it.todo(
      "isBanned=true hides everything except \"Copy Text\" and \"Delete Message\" (per the ...(!isBanned ? [...] : []) spreads)",
   );
   it.todo(
      "clicking \"Pin Message\" calls pinMessage, shows success/error toast based on result",
   );
   it.todo(
      "clicking \"Delete Message\" calls deleteMessage, then onDelete(message.id) regardless of success, plus a toast either way",
   );
   it.todo(
      "clicking \"Copy Text\" calls copyText and shows success/error toast from the promise",
   );
});
