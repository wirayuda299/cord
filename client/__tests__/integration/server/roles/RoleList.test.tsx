// components/server/roles/list.tsx
//
// Why (Smoke): loading/empty/data states plus selection highlighting —
// simpler shape than RoleFormView/RoleDetailView.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";
import RoleList from "@/components/server/roles/list";
import { getAllRoles } from "@/lib/api/roles";
import type { Role } from "@/types/role";

afterEach(() => {
   cleanup();
});

vi.mock("@/lib/api/roles", () => ({
   getAllRoles: vi.fn(),
}));

vi.mock("next/navigation", () => ({
   useParams: () => ({ id: "srv-1" }),
}));

function renderIsolated(ui: ReactElement) {
   return render(
      <SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>,
   );
}

function role(overrides: Partial<Role>): Role {
   return {
      id: "role-1",
      name: "Moderator",
      server_id: "srv-1",
      color: "#5865f2",
      icon: "",
      hoist: false,
      mentionable: false,
      ...overrides,
   };
}

describe("RoleList", () => {
   it('loading skeleton while isLoading; "No roles yet." when the resolved list is empty', async () => {
      let resolve!: (v: Role[]) => void;
      vi.mocked(getAllRoles).mockReturnValue(
         new Promise((r) => {
            resolve = r;
         }),
      );

      const { container } = renderIsolated(
         <RoleList
            selectedId={null}
            onSelect={vi.fn()}
            onCreateClick={vi.fn()}
            memberCounts={{}}
         />,
      );

      // skeleton renders a block of animated placeholder rows
      expect(container.querySelector(".animate-pulse")).not.toBeNull();
      expect(screen.queryByText("No roles yet.")).toBeNull();

      resolve([]);

      await screen.findByText("No roles yet.");
      expect(container.querySelector(".animate-pulse")).toBeNull();
   });

   it("clicking a role calls onSelect(id, role); the currently selectedId role is visually marked (aria-current)", async () => {
      const r1 = role({ id: "role-1", name: "Moderator" });
      const r2 = role({ id: "role-2", name: "Admin" });
      vi.mocked(getAllRoles).mockResolvedValue([r1, r2]);
      const onSelect = vi.fn();

      renderIsolated(
         <RoleList
            selectedId="role-2"
            onSelect={onSelect}
            onCreateClick={vi.fn()}
            memberCounts={{}}
         />,
      );

      const modBtn = await screen.findByText("Moderator");
      const adminBtn = await screen.findByText("Admin");

      expect(adminBtn.closest("button")?.getAttribute("aria-current")).toBe("true");
      expect(modBtn.closest("button")?.getAttribute("aria-current")).toBeNull();

      fireEvent.click(modBtn);
      expect(onSelect).toHaveBeenCalledWith("role-1", r1);
   });

   it('clicking "Create Role" calls both onCreateClick() and mutate()', async () => {
      vi.mocked(getAllRoles).mockResolvedValue([]);
      const onCreateClick = vi.fn();

      renderIsolated(
         <RoleList
            selectedId={null}
            onSelect={vi.fn()}
            onCreateClick={onCreateClick}
            memberCounts={{}}
         />,
      );

      await screen.findByText("No roles yet.");
      expect(getAllRoles).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText("Create Role"));

      expect(onCreateClick).toHaveBeenCalledTimes(1);
      // mutate() re-invokes the SWR fetcher
      await vi.waitFor(() => expect(getAllRoles).toHaveBeenCalledTimes(2));
   });
});
