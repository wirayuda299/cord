// components/server/roles/role-detail-view.tsx
//
// Why: tab switching (display/permissions/members — stub MembersTab to
// isolate), and a real destructive-action confirm state machine for role
// deletion.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";
import RoleDetailView from "@/components/server/roles/role-detail-view";
import { deleteRole } from "@/lib/api/roles";
import { findPermissionByRoleId } from "@/lib/api/permissions";
import type { Role } from "@/types/role";

afterEach(() => {
   cleanup();
});

vi.mock("@/lib/api/permissions", () => ({
   findPermissionByRoleId: vi.fn(),
}));

vi.mock("@/lib/api/roles", () => ({
   deleteRole: vi.fn(),
}));

// isolate this test to RoleDetailView's own tab/delete logic — MembersTab
// has its own dedicated test file
vi.mock("@/components/server/roles/members", () => ({
   default: () => <div data-testid="members-tab-stub" />,
}));

function renderIsolated(ui: ReactElement) {
   return render(
      <SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>,
   );
}

const role: Role = {
   id: "role-1",
   name: "Moderator",
   server_id: "srv-1",
   color: "#5865f2",
   icon: "",
   hoist: false,
   mentionable: false,
};

describe("RoleDetailView", () => {
   it('clicking a tab switches activeTab and renders the matching content; "permissions" tab shows a skeleton while isLoading', async () => {
      let resolve!: (v: { permissions: string[] }[]) => void;
      vi.mocked(findPermissionByRoleId).mockReturnValue(
         new Promise((r) => {
            // findPermissionByRoleId itself resolves a single object|null —
            // the mocked module here stands in for the api function
            resolve = r as unknown as (v: { permissions: string[] }[]) => void;
         }),
      );

      const { container } = renderIsolated(
         <RoleDetailView
            role={role}
            onBack={vi.fn()}
            onEdit={vi.fn()}
            serverOwner="owner-1"
            serverID="srv-1"
         />,
      );

      // starts on "display"
      expect(screen.getByText("Role Name")).not.toBeNull();

      fireEvent.click(screen.getByRole("tab", { name: /permissions/i }));
      expect(container.querySelector(".animate-pulse")).not.toBeNull();
      expect(screen.queryByText("Role Name")).toBeNull();

      resolve({ permissions: [] } as unknown as { permissions: string[] }[]);
      await vi.waitFor(() =>
         expect(container.querySelector(".animate-pulse")).toBeNull(),
      );
      screen.getByText(/permissions enabled/i);

      fireEvent.click(screen.getByRole("tab", { name: /members/i }));
      expect(screen.getByTestId("members-tab-stub")).not.toBeNull();

      fireEvent.click(screen.getByRole("tab", { name: /display/i }));
      expect(screen.getByText("Role Name")).not.toBeNull();
   });

   it('clicking "Delete Role" moves to deleteState:"confirm"; clicking "Confirm" calls deleteRole, and on success calls onDeleted?.() ?? onBack(); on thrown error moves to deleteState:"error" with the message shown and a "Dismiss" back to idle', async () => {
      vi.mocked(findPermissionByRoleId).mockResolvedValue(null);
      const onBack = vi.fn();
      const onDeleted = vi.fn();

      vi.mocked(deleteRole).mockRejectedValueOnce(new Error("cannot delete owner role"));

      const { rerender } = renderIsolated(
         <RoleDetailView
            role={role}
            onBack={onBack}
            onEdit={vi.fn()}
            onDeleted={onDeleted}
            serverOwner="owner-1"
            serverID="srv-1"
         />,
      );

      fireEvent.click(await screen.findByText("Delete Role"));
      screen.getByText("Delete this role?");

      fireEvent.click(screen.getByText("Confirm"));

      await screen.findByText("cannot delete owner role");
      expect(deleteRole).toHaveBeenCalledWith("role-1", "srv-1");
      expect(onDeleted).not.toHaveBeenCalled();
      expect(onBack).not.toHaveBeenCalled();

      fireEvent.click(screen.getByText("Dismiss"));
      expect(screen.queryByText("cannot delete owner role")).toBeNull();
      screen.getByText("Delete Role");

      // second attempt succeeds → onDeleted?.() ?? onBack() prefers onDeleted
      vi.mocked(deleteRole).mockResolvedValueOnce(undefined);
      fireEvent.click(screen.getByText("Delete Role"));
      fireEvent.click(screen.getByText("Confirm"));

      await vi.waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
      expect(onBack).not.toHaveBeenCalled();

      // now without onDeleted — falls back to onBack()
      cleanup();
      vi.mocked(deleteRole).mockResolvedValueOnce(undefined);
      renderIsolated(
         <RoleDetailView
            role={role}
            onBack={onBack}
            onEdit={vi.fn()}
            serverOwner="owner-1"
            serverID="srv-1"
         />,
      );
      fireEvent.click(await screen.findByText("Delete Role"));
      fireEvent.click(screen.getByText("Confirm"));
      await vi.waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
   });

   it("clicking \"Edit Role\" calls onEdit(data?.permissions ?? []) — passing through the currently-loaded permission set, not an empty array, once loaded", async () => {
      vi.mocked(findPermissionByRoleId).mockResolvedValue({
         id: "perm-1",
         role_id: "role-1",
         permissions: ["view_channel", "manage_role"],
      });
      const onEdit = vi.fn();

      renderIsolated(
         <RoleDetailView
            role={role}
            onBack={vi.fn()}
            onEdit={onEdit}
            serverOwner="owner-1"
            serverID="srv-1"
         />,
      );

      // wait for the permissions fetch to resolve before editing, so the
      // loaded set (not the pre-load empty default) is what's passed
      await vi.waitFor(() => expect(findPermissionByRoleId).toHaveBeenCalled());

      fireEvent.click(await screen.findByText("Edit Role"));

      expect(onEdit).toHaveBeenCalledWith(["view_channel", "manage_role"]);
   });

   it('"Back to Roles" always calls onBack() regardless of activeTab/deleteState', async () => {
      vi.mocked(findPermissionByRoleId).mockResolvedValue(null);
      const onBack = vi.fn();

      renderIsolated(
         <RoleDetailView
            role={role}
            onBack={onBack}
            onEdit={vi.fn()}
            serverOwner="owner-1"
            serverID="srv-1"
         />,
      );

      fireEvent.click(screen.getByRole("tab", { name: /members/i }));
      fireEvent.click(screen.getByText("Delete Role"));
      screen.getByText("Delete this role?");

      fireEvent.click(screen.getByText("Back to Roles"));

      expect(onBack).toHaveBeenCalledTimes(1);
   });
});
