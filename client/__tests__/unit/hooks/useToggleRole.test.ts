import { renderHook, act } from "@testing-library/react";
import useToggleRoleMember from "@/hooks/useToggleRole";
import { assignRole, unassignRole } from "@/lib/api/roles";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/roles", () => ({
   assignRole: vi.fn(),
   unassignRole: vi.fn(),
}));

describe("use toggle role test", () => {
   it("swaps role: unassigns old then assigns new", async () => {
      const onMutate = vi.fn();
      const { result } = renderHook(() =>
         useToggleRoleMember({
            serverID: "server_1",
            member: { user_id: "user_1", role_id: "role_old" },
            serverOwner: "owner_1",
            onMutate,
         }),
      );

      await act(async () => {
         await result.current.handleToggleRole("role_new");
      });

      expect(unassignRole).toHaveBeenCalledWith(
         "user_1",
         "server_1",
         "role_old",
      );
      expect(assignRole).toHaveBeenCalledWith("user_1", "server_1", "role_new");
      expect(onMutate).toHaveBeenCalled();
      expect(result.current.pendingRoleId).toBeNull();
   });

   it("should not call unassign and assign function if same owner", async () => {
      const onMutate = vi.fn();
      const { result } = renderHook(() =>
         useToggleRoleMember({
            serverID: "server_1",
            member: { user_id: "user_1", role_id: "role_old" },
            serverOwner: "user_1",
            onMutate,
         }),
      );

      await act(async () => {
         await result.current.handleToggleRole("role_new");
      });

      expect(unassignRole).not.toHaveBeenCalled();
      expect(assignRole).not.toHaveBeenCalled();
      expect(onMutate).not.toHaveBeenCalled();
      expect(result.current.pendingRoleId).toBeNull();
   });
});
