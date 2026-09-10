// components/server/ServerSettingDialog.tsx
//
// Why: the settings-panel navigation orchestrator — stub every
// next/dynamic-imported panel (ServerProfile, roles settings, Members,
// Invites, BoostPerks, SafetySetup, AuditLog, Bans, DeleteServer) to
// isolate this test to the tab-switching/mobile-view logic itself, same
// "stub the child" approach used for MessageMenu and recommended for
// RolesSettings.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ServerSettingDialog from "@/components/server/ServerSettingDialog";

afterEach(() => {
   cleanup();
});

vi.mock("@/components/server/profile", () => ({
   default: () => <div>stub:server-profile</div>,
}));
vi.mock("@/components/server/roles", () => ({
   default: () => <div>stub:roles</div>,
}));
vi.mock("@/components/server/Members", () => ({
   default: () => <div>stub:members</div>,
}));
vi.mock("@/components/server/Invites", () => ({
   default: () => <div>stub:invites</div>,
}));
vi.mock("@/components/server/BoostPerks", () => ({
   default: () => <div>stub:boost-perks</div>,
}));
vi.mock("@/components/server/SafetySetup", () => ({
   default: () => <div>stub:safety-setup</div>,
}));
vi.mock("@/components/server/AuditLog", () => ({
   default: () => <div>stub:audit-log</div>,
}));
vi.mock("@/components/server/Bans", () => ({
   default: () => <div>stub:bans</div>,
}));
vi.mock("@/components/server/DeleteServer", () => ({
   default: () => <div>stub:delete-server</div>,
}));

function openDialog() {
   const trigger = screen.getByText("Server Settings").closest("button")!;
   fireEvent.click(trigger);
}

// next/dynamic panels resolve asynchronously (even mocked, via a real
// dynamic import()), so switching to one briefly shows its "Loading X..."
// fallback first — callers must await the stub text, not query it sync.

function mainEl() {
   return document.querySelector("main") as HTMLElement;
}

// "hidden" is a real Tailwind token here, but the element's base className
// also includes "overflow-hidden" — a substring check would false-positive
// on that, so check the exact class token instead.
function isMobileNavView() {
   return mainEl().classList.contains("hidden");
}

describe("ServerSettingDialog", () => {
   it('clicking a sidebar NavItem switches which stubbed panel renders and sets mobileView to "panel"', async () => {
      render(
         <ServerSettingDialog
            serverId="srv-1"
            serverOwner="owner-1"
            serverName="My Server"
         />,
      );
      openDialog();

      await screen.findByText("stub:server-profile");
      // mobileView starts at "nav": the panel <main> is hidden on mobile
      expect(isMobileNavView()).toBe(true);

      fireEvent.click(screen.getByRole("tab", { name: /Roles/ }));

      await screen.findByText("stub:roles");
      expect(screen.queryByText("stub:server-profile")).toBeNull();
      // mobileView flipped to "panel": no longer hidden on mobile
      expect(isMobileNavView()).toBe(false);
   });

   it('opening the dialog always resets mobileView to "nav"', async () => {
      render(
         <ServerSettingDialog
            serverId="srv-1"
            serverOwner="owner-1"
            serverName="My Server"
         />,
      );
      openDialog();
      await screen.findByText("stub:server-profile");

      fireEvent.click(screen.getByRole("tab", { name: /Roles/ }));
      await screen.findByText("stub:roles");
      expect(isMobileNavView()).toBe(false); // now in "panel" view

      // close, then reopen
      fireEvent.click(screen.getByText("Close").closest("button")!);
      const trigger = screen.getByText("Server Settings").closest("button")!;
      fireEvent.click(trigger);

      await screen.findByRole("tab", { name: /Roles/ });
      expect(isMobileNavView()).toBe(true); // back to "nav" view
   });

   it('on mobile, the back-chevron button returns mobileView to "nav" without changing active', async () => {
      render(
         <ServerSettingDialog
            serverId="srv-1"
            serverOwner="owner-1"
            serverName="My Server"
         />,
      );
      openDialog();
      await screen.findByText("stub:server-profile");

      fireEvent.click(screen.getByRole("tab", { name: /Roles/ }));
      await screen.findByText("stub:roles");
      expect(isMobileNavView()).toBe(false);

      fireEvent.click(screen.getByText("Back to settings list").closest("button")!);

      expect(isMobileNavView()).toBe(true); // back to "nav"
      // active panel is still "roles" — its tab stays selected
      expect(
         screen.getByRole("tab", { name: /Roles/ }).getAttribute("aria-selected"),
      ).toBe("true");
   });

   it("the mobile header title (PANEL_LABELS[active]) always matches the currently active panel", async () => {
      render(
         <ServerSettingDialog
            serverId="srv-1"
            serverOwner="owner-1"
            serverName="My Server"
         />,
      );
      openDialog();
      await screen.findByText("stub:server-profile");
      // "Overview" appears both as the tab label and the mobile header title
      expect(screen.getAllByText("Overview").length).toBeGreaterThanOrEqual(2);

      fireEvent.click(screen.getByRole("tab", { name: /Members/ }));
      await screen.findByText("stub:members");
      expect(screen.getAllByText("Members").length).toBeGreaterThanOrEqual(2);

      fireEvent.click(screen.getByRole("tab", { name: /Delete Server/ }));
      await screen.findByText("stub:delete-server");
      expect(screen.getAllByText("Delete Server").length).toBeGreaterThanOrEqual(2);
   });
});
