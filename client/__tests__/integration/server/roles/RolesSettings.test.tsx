// components/server/roles/roles-settings.tsx
//
// Why: the view-router for the whole roles feature (list/create/detail/
// edit) — stub RoleList/RoleDetailView/RoleFormView to isolate this test
// to the navigation wiring itself, mirroring the ServerSettingDialog
// approach.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";
import RolesSettings from "@/components/server/roles/roles-settings";
import { apiFetcher } from "@/lib/fetcher";
import type { Role } from "@/types/role";

afterEach(() => {
   cleanup();
});

vi.mock("@/lib/fetcher", () => ({
   apiFetcher: vi.fn(),
}));

const role: Role = {
   id: "role-1",
   name: "Moderator",
   server_id: "srv-1",
   color: "#5865f2",
   icon: "",
   hoist: false,
   mentionable: false,
};

vi.mock("@/components/server/roles/list", () => ({
   default: ({
      onSelect,
      onCreateClick,
      memberCounts,
   }: {
      onSelect: (id: string, role: Role) => void;
      onCreateClick: () => void;
      memberCounts: Record<string, number>;
   }) => (
      <div>
         <button onClick={() => onSelect(role.id, role)}>select-role</button>
         <button onClick={onCreateClick}>create-role</button>
         <div data-testid="member-counts">{JSON.stringify(memberCounts)}</div>
      </div>
   ),
}));

vi.mock("@/components/server/roles/role-detail-view", () => ({
   default: ({
      onBack,
      onEdit,
      onDeleted,
   }: {
      onBack: () => void;
      onEdit: (permissions: string[]) => void;
      onDeleted?: () => void;
   }) => (
      <div>
         <span>detail-view</span>
         <button onClick={onBack}>detail-back</button>
         <button onClick={() => onEdit(["view_channel", "manage_role"])}>
            detail-edit
         </button>
         {onDeleted && <button onClick={onDeleted}>detail-deleted</button>}
      </div>
   ),
}));

vi.mock("@/components/server/roles/role-form-view", () => ({
   default: (props: { mode: "create" | "edit"; onBack: () => void; initialPermissions?: string[] }) => (
      <div>
         <span>form-view-{props.mode}</span>
         <span data-testid="initial-permissions">
            {JSON.stringify(props.initialPermissions ?? null)}
         </span>
         <button onClick={props.onBack}>form-back</button>
      </div>
   ),
}));

function renderIsolated(ui: ReactElement) {
   return render(
      <SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>,
   );
}

describe("RolesSettings", () => {
   it('selecting a role in the (stubbed) RoleList switches to "detail" view with that role', async () => {
      vi.mocked(apiFetcher).mockResolvedValue([]);

      renderIsolated(<RolesSettings serverOwner="owner-1" serverID="srv-1" />);

      fireEvent.click(screen.getByText("select-role"));

      screen.getByText("detail-view");
   });

   it('onEdit from the detail view switches to "edit" with initialPermissions passed through correctly', async () => {
      vi.mocked(apiFetcher).mockResolvedValue([]);

      renderIsolated(<RolesSettings serverOwner="owner-1" serverID="srv-1" />);

      fireEvent.click(screen.getByText("select-role"));
      fireEvent.click(screen.getByText("detail-edit"));

      screen.getByText("form-view-edit");
      expect(screen.getByTestId("initial-permissions").textContent).toBe(
         JSON.stringify(["view_channel", "manage_role"]),
      );
   });

   it('onBack from detail returns to "list" and clears selectedRole; onBack from edit returns to "detail" (not "list")', async () => {
      vi.mocked(apiFetcher).mockResolvedValue([]);

      renderIsolated(<RolesSettings serverOwner="owner-1" serverID="srv-1" />);

      fireEvent.click(screen.getByText("select-role"));
      screen.getByText("detail-view");

      fireEvent.click(screen.getByText("detail-back"));
      screen.getByText("select-role");
      expect(screen.queryByText("detail-view")).toBeNull();

      // re-select then go into edit, then back from edit should return to
      // detail (not all the way to list)
      fireEvent.click(screen.getByText("select-role"));
      fireEvent.click(screen.getByText("detail-edit"));
      screen.getByText("form-view-edit");

      fireEvent.click(screen.getByText("form-back"));
      screen.getByText("detail-view");
      expect(screen.queryByText("select-role")).toBeNull();
   });

   it("onDeleted from detail returns to \"list\" and clears selectedRole (distinct from plain onBack)", async () => {
      vi.mocked(apiFetcher).mockResolvedValue([]);

      renderIsolated(<RolesSettings serverOwner="owner-1" serverID="srv-1" />);

      fireEvent.click(screen.getByText("select-role"));
      fireEvent.click(screen.getByText("detail-deleted"));

      screen.getByText("select-role");
      expect(screen.queryByText("detail-view")).toBeNull();
   });

   it("memberCounts passed to RoleList is correctly tallied per role_id from the members SWR data", async () => {
      vi.mocked(apiFetcher).mockResolvedValue([
         { role_id: "role-1" },
         { role_id: "role-1" },
         { role_id: "role-2" },
         { role_id: null },
      ]);

      renderIsolated(<RolesSettings serverOwner="owner-1" serverID="srv-1" />);

      await vi.waitFor(() =>
         expect(screen.getByTestId("member-counts").textContent).toBe(
            JSON.stringify({ "role-1": 2, "role-2": 1 }),
         ),
      );
   });
});
