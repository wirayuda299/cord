// components/server/roles/members.tsx
//
// Why (Smoke): thin SWR + already-tested-hook wrapper — verify wiring, not
// the hook's own internals (covered in useToggleRole.test.ts).

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";
import MembersTab from "@/components/server/roles/members";
import { getAllMemberByRole, type UserRole } from "@/lib/api/roles";
import type { Role } from "@/types/role";

afterEach(() => {
   cleanup();
});

vi.mock("@/lib/api/roles", () => ({
   getAllMemberByRole: vi.fn(),
   assignRole: vi.fn(),
   unassignRole: vi.fn(),
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

function user(overrides: Partial<UserRole>): UserRole {
   return {
      user_id: "user-1",
      username: "wira",
      avatar_url: "",
      role_id: "role-1",
      ...overrides,
   };
}

describe("MembersTab", () => {
   it('loading spinner while isLoading; empty state ("No members have this role") when the list is empty', async () => {
      let resolve!: (v: UserRole[]) => void;
      vi.mocked(getAllMemberByRole).mockReturnValue(
         new Promise((r) => {
            resolve = r;
         }),
      );

      renderIsolated(
         <MembersTab role={role} serverID="srv-1" serverOwner="owner-1" />,
      );

      expect(document.querySelector(".animate-spin")).not.toBeNull();
      expect(screen.queryByText("No members have this role")).toBeNull();

      resolve([]);

      await screen.findByText("No members have this role");
      expect(document.querySelector(".animate-spin")).toBeNull();
   });

   it("each row's remove button is disabled while pendingRoleId is set (delegates to useToggleRoleMember)", async () => {
      vi.mocked(getAllMemberByRole).mockResolvedValue([
         user({ user_id: "user-1", username: "wira", role_id: "role-1" }),
      ]);
      const { unassignRole } = await import("@/lib/api/roles");
      // never resolves — keeps handleToggleRole "in flight" so pendingRoleId
      // stays set for the duration of the assertion
      vi.mocked(unassignRole).mockReturnValue(new Promise(() => {}));

      renderIsolated(
         <MembersTab role={role} serverID="srv-1" serverOwner="owner-1" />,
      );

      const removeButton = (await screen.findByText("wira"))
         .closest("div.relative")
         ?.querySelector("button") as HTMLButtonElement;

      expect(removeButton.disabled).toBe(false);

      fireEvent.click(removeButton);

      await vi.waitFor(() => expect(removeButton.disabled).toBe(true));
   });
});
