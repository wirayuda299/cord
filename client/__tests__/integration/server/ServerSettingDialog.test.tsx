// components/server/ServerSettingDialog.tsx
//
// Why: the settings-panel navigation orchestrator — stub every
// next/dynamic-imported panel (ServerProfile, roles settings, Members,
// Invites, BoostPerks, SafetySetup, AuditLog, Bans, DeleteServer) to
// isolate this test to the tab-switching/mobile-view logic itself, same
// "stub the child" approach used for MessageMenu and recommended for
// RolesSettings.

import { describe, it } from "vitest";

describe("ServerSettingDialog", () => {
   it.todo(
      'clicking a sidebar NavItem switches which stubbed panel renders and sets mobileView to "panel"',
   );
   it.todo(
      'opening the dialog always resets mobileView to "nav" (onOpenChange handler)',
   );
   it.todo(
      'on mobile, the back-chevron button returns mobileView to "nav" without changing active',
   );
   it.todo(
      "the mobile header title (PANEL_LABELS[active]) always matches the currently active panel",
   );
});
