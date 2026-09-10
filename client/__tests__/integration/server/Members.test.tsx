// components/server/Members.tsx
//
// Why: the highest-complexity component surveyed — kick/ban/unban
// destructive actions, role assign/remove via the already-tested
// useToggleRoleMember hook, dual search+role filtering, and
// useSWR({suspense:true}) which needs either a <Suspense> boundary in the
// test render or mocking around it.
//
// Found & fixed a real bug: hasKickMemberPerm and hasBanMemberPerm both
// used the SAME SWR key (`/api/permissions/${serverID}`) with different
// fetchers. SWR dedupes concurrent requests by key, so only one of the two
// fetchers actually ran and both hooks resolved to the same value —
// conflating kick and ban permissions. Fixed by giving each its own key
// (`/kick` / `/ban` suffix) in the component.
//
// Suspense gotcha, verified: wrapping the render in a real <Suspense> did
// NOT work in this jsdom + RTL + React 19 + swr@2.5.1 combination — traced
// down to a minimal repro (bare useSWR({suspense:true}) inside <Suspense>,
// nothing from this component involved) that also hangs on the fallback
// forever. That's a SWR/React-in-jsdom interaction, not app logic, so
// `swr`'s `useSWR`/`mutate` are mocked directly here instead — this also
// makes the four concurrent useSWR calls (two of them keyed only by
// permission type) trivially controllable per test without fighting SWR's
// real cache/suspense timing.

import Members from "@/components/server/Members";
import { kickMember, banMember, unbanMember } from "@/lib/actions/servers";
import { unassignRole } from "@/lib/api/roles";
import { toast } from "@/components/ui/toast";
import useToggleRoleMember from "@/hooks/useToggleRole";
import type { Member } from "@/types/server";
import type { Role } from "@/types/role";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/servers", () => ({
   kickMember: vi.fn(),
   banMember: vi.fn(),
   unbanMember: vi.fn(),
}));

vi.mock("@/lib/api/roles", () => ({
   getAllRoles: vi.fn(),
   unassignRole: vi.fn(),
}));

vi.mock("@/lib/api/permissions", () => ({
   hasPermission: vi.fn(),
}));

vi.mock("@/lib/fetcher", () => ({
   apiFetcher: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
   toast: { add: vi.fn() },
}));

vi.mock("@/hooks/useToggleRole", () => ({
   default: vi.fn(),
}));

const hoisted = vi.hoisted(() => ({
   swrState: {} as Record<string, { data?: unknown; error?: unknown; isLoading?: boolean }>,
   mutateMembersMock: vi.fn(),
   globalMutateMock: vi.fn(),
}));

vi.mock("swr", () => ({
   default: (key: string) => {
      const entry = hoisted.swrState[key] ?? {};
      return {
         data: entry.data,
         error: entry.error,
         isLoading: entry.isLoading ?? false,
         mutate: key.startsWith("/api/members/") ? hoisted.mutateMembersMock : vi.fn(),
      };
   },
   mutate: (...args: unknown[]) => hoisted.globalMutateMock(...args),
}));

afterEach(() => {
   cleanup();
});

beforeEach(() => {
   hoisted.swrState = {};
   vi.mocked(useToggleRoleMember).mockReturnValue({
      error: null,
      pendingRoleId: null,
      handleToggleRole: vi.fn(),
      setError: vi.fn(),
   });
});

function member(overrides: Partial<Member> = {}): Member {
   return {
      id: "m-1",
      user_id: "user-1",
      username: "alice",
      avatar_url: "",
      avatar_id: "",
      joined_at: "2026-01-01T00:00:00Z",
      role: null,
      role_id: null,
      role_color: null,
      server_id: "srv-1",
      is_banned: false,
      ...overrides,
   };
}

function role(overrides: Partial<Role> = {}): Role {
   return {
      id: "role-1",
      name: "Moderator",
      server_id: "srv-1",
      color: "#ff0000",
      icon: "",
      hoist: false,
      mentionable: true,
      ...overrides,
   };
}

function setup({
   members,
   roles = [],
   kickPerm = true,
   banPerm = true,
   serverOwner = "owner-1",
}: {
   members: Member[];
   roles?: Role[];
   kickPerm?: boolean;
   banPerm?: boolean;
   serverOwner?: string;
}) {
   hoisted.swrState["/api/permissions/srv-1/kick"] = { data: kickPerm };
   hoisted.swrState["/api/permissions/srv-1/ban"] = { data: banPerm };
   hoisted.swrState["/api/members/srv-1"] = { data: members };
   hoisted.swrState["/api/roles/srv-1"] = { data: roles };

   return render(<Members serverID="srv-1" serverOwner={serverOwner} />);
}

function openMenuFor(username: string) {
   const row = screen.getByText(username).closest(".group") as HTMLElement;
   const trigger = row.querySelector('[data-slot="dropdown-menu-trigger"]') as HTMLElement;
   fireEvent.click(trigger);
   return row;
}

describe("Members", () => {
   it("renders member rows once hasKickMemberPerm/hasBanMemberPerm data is available (the real Suspense-mode fetch is a SWR/React concern, mocked here — see file header)", () => {
      setup({ members: [member()] });
      expect(screen.getByText("alice")).not.toBeNull();
   });

   it('kick/ban dropdown items only appear when perms are true, and never for the server owner ("Server owner — role locked" instead)', () => {
      const owner = member({ id: "m-owner", user_id: "owner-1", username: "owner-person" });
      const regular = member({ id: "m-bob", user_id: "user-2", username: "bob" });
      setup({
         members: [owner, regular],
         kickPerm: true,
         banPerm: true,
         serverOwner: "owner-1",
      });

      openMenuFor("owner-person");
      expect(screen.getByText("Server owner — role locked")).not.toBeNull();
      expect(screen.queryByText(/^Kick /)).toBeNull();
      expect(screen.queryByText(/^Ban /)).toBeNull();
   });

   it("hides kick/ban items for a non-owner when the corresponding permission is false", () => {
      const regular = member({ user_id: "user-2", username: "bob" });
      setup({
         members: [regular],
         kickPerm: false,
         banPerm: false,
         serverOwner: "owner-1",
      });

      openMenuFor("bob");
      expect(screen.queryByText("Kick bob")).toBeNull();
      expect(screen.queryByText("Ban bob")).toBeNull();
   });

   it("shows kick/ban items for a non-owner when perms are true", () => {
      const regular = member({ user_id: "user-2", username: "bob" });
      setup({
         members: [regular],
         kickPerm: true,
         banPerm: true,
         serverOwner: "owner-1",
      });

      openMenuFor("bob");
      expect(screen.getByText("Kick bob")).not.toBeNull();
      expect(screen.getByText("Ban bob")).not.toBeNull();
   });

   it("confirming a kick calls kickMember, then onMutate() + globalMutate('/api/members') on success; error toast + dialog stays on failure", async () => {
      vi.mocked(kickMember).mockResolvedValue({ success: false, message: "no permission" });
      const regular = member({ user_id: "user-2", username: "bob" });
      setup({ members: [regular] });

      openMenuFor("bob");
      fireEvent.click(screen.getByText("Kick bob"));
      fireEvent.click(screen.getByRole("button", { name: "Kick" }));

      await waitFor(() => expect(kickMember).toHaveBeenCalledWith("user-2", "srv-1"));
      await waitFor(() =>
         expect(toast.add).toHaveBeenCalledWith({ title: "no permission", type: "error" }),
      );
      // dialog stays open on failure
      expect(screen.getByText(/Are you sure you want to kick this member/)).not.toBeNull();
      expect(hoisted.mutateMembersMock).not.toHaveBeenCalled();
      expect(hoisted.globalMutateMock).not.toHaveBeenCalled();

      vi.mocked(kickMember).mockResolvedValue({ success: true, message: "kicked" });
      fireEvent.click(screen.getByRole("button", { name: "Kick" }));

      await waitFor(() =>
         expect(screen.queryByText(/Are you sure you want to kick this member/)).toBeNull(),
      );
      expect(hoisted.mutateMembersMock).toHaveBeenCalled();
      expect(hoisted.globalMutateMock).toHaveBeenCalledWith("/api/members");
   });

   it("confirming a ban with a typed reason calls banMember(serverID, userId, reason) — same success/failure handling as kick", async () => {
      vi.mocked(banMember).mockResolvedValue({ success: false, message: "denied" });
      const regular = member({ user_id: "user-2", username: "bob" });
      setup({ members: [regular] });

      openMenuFor("bob");
      fireEvent.click(screen.getByText("Ban bob"));
      fireEvent.change(screen.getByPlaceholderText("Optional reason for ban"), {
         target: { value: "spamming" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Ban" }));

      await waitFor(() =>
         expect(banMember).toHaveBeenCalledWith("srv-1", "user-2", "spamming"),
      );
      await waitFor(() =>
         expect(toast.add).toHaveBeenCalledWith({ title: "denied", type: "error" }),
      );
      expect(screen.getByText(/Are you sure you want to ban this member/)).not.toBeNull();

      vi.mocked(banMember).mockResolvedValue({ success: true, message: "banned" });
      fireEvent.click(screen.getByRole("button", { name: "Ban" }));
      await waitFor(() =>
         expect(screen.queryByText(/Are you sure you want to ban this member/)).toBeNull(),
      );
      expect(hoisted.mutateMembersMock).toHaveBeenCalled();
   });

   it('"Unban" replaces "Ban" for an already-banned member; confirming calls unbanMember', async () => {
      vi.mocked(unbanMember).mockResolvedValue({ success: true, message: "unbanned" });
      const banned = member({ user_id: "user-2", username: "bob", is_banned: true });
      setup({ members: [banned] });

      openMenuFor("bob");
      expect(screen.queryByText("Ban bob")).toBeNull();
      fireEvent.click(screen.getByText("Unban bob"));

      await waitFor(() => expect(unbanMember).toHaveBeenCalledWith("srv-1", "user-2"));
   });

   it("assigning a role delegates to useToggleRoleMember.handleToggleRole and shows a spinner on the pending role while pendingRoleId is set", () => {
      const handleToggleRole = vi.fn();
      vi.mocked(useToggleRoleMember).mockReturnValue({
         error: null,
         pendingRoleId: "role-2",
         handleToggleRole,
         setError: vi.fn(),
      });
      const withRole = member({ user_id: "user-2", username: "bob", role_id: "role-1" });
      const roles = [role({ id: "role-1", name: "Mod" }), role({ id: "role-2", name: "Admin" })];
      setup({ members: [withRole], roles });

      openMenuFor("bob");
      // "Admin"/"Mod" also appear as role-filter pills in the header, so
      // scope the query to the open dropdown content, not the whole document
      const menu = document.querySelector(
         '[data-slot="dropdown-menu-content"]',
      ) as HTMLElement;
      const adminItem = within(menu)
         .getByText("Admin")
         .closest('[data-slot="dropdown-menu-item"]') as HTMLElement;
      expect(adminItem.querySelector("svg.animate-spin")).not.toBeNull();

      const modItem = within(menu)
         .getByText("Mod")
         .closest('[data-slot="dropdown-menu-item"]') as HTMLElement;
      fireEvent.click(modItem);
      expect(handleToggleRole).toHaveBeenCalledWith("role-1");
   });

   it('"Remove role" delegates to unassignRole with (userId, serverID, roleId)', async () => {
      vi.mocked(unassignRole).mockResolvedValue(undefined);
      const withRole = member({ user_id: "user-2", username: "bob", role_id: "role-1" });
      const roles = [role({ id: "role-1", name: "Mod" })];
      setup({ members: [withRole], roles });

      openMenuFor("bob");
      fireEvent.click(screen.getByText("Remove role"));

      await waitFor(() => expect(unassignRole).toHaveBeenCalledWith("user-2", "srv-1", "role-1"));
   });

   it("search + role-pill filters combine (matchesQuery && matchesRole); 'No role' pill filters to !m.role_id", () => {
      const roles = [role({ id: "role-1", name: "Mod" })];
      const members = [
         member({ id: "m-u1", user_id: "u1", username: "alice", role_id: "role-1" }),
         member({ id: "m-u2", user_id: "u2", username: "alina", role_id: null }),
         member({ id: "m-u3", user_id: "u3", username: "bob", role_id: "role-1" }),
      ];
      setup({ members, roles });

      fireEvent.change(screen.getByPlaceholderText("Search members…"), {
         target: { value: "ali" },
      });
      expect(screen.getByText("alice")).not.toBeNull();
      expect(screen.getByText("alina")).not.toBeNull();
      expect(screen.queryByText("bob")).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: "Mod" }));
      expect(screen.getByText("alice")).not.toBeNull();
      expect(screen.queryByText("alina")).toBeNull(); // has no role, filtered out

      fireEvent.change(screen.getByPlaceholderText("Search members…"), { target: { value: "" } });
      fireEvent.click(screen.getByRole("button", { name: "Mod" })); // toggle off
      fireEvent.click(screen.getByRole("button", { name: "No role" }));
      expect(screen.getByText("alina")).not.toBeNull();
      expect(screen.queryByText("alice")).toBeNull();
      expect(screen.queryByText("bob")).toBeNull();
   });
});
