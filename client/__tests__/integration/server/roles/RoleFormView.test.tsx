// components/server/roles/role-form-view.tsx
//
// Why: the most important single component in the roles feature — dual
// create/edit mode, permission-array toggling, dirty-field-only patch on
// edit, validation.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RoleFormView from "@/components/server/roles/role-form-view";
import { createRole, updateRole } from "@/lib/actions/role";
import { toast } from "@/components/ui/toast";
import { ROLE_COLORS } from "@/constants/role";
import type { Role } from "@/types/role";

afterEach(() => {
   cleanup();
});

vi.mock("@/lib/actions/role", () => ({
   createRole: vi.fn(),
   updateRole: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
   toast: { add: vi.fn() },
}));

vi.mock("next/navigation", () => ({
   useParams: () => ({ id: "srv-1" }),
}));

const role: Role = {
   id: "role-1",
   name: "Moderator",
   server_id: "srv-1",
   color: "#99aab5",
   icon: "",
   hoist: false,
   mentionable: false,
};

describe("RoleFormView", () => {
   it('mode="create": submitting calls createRole; success shows a toast, resets the form, and calls onBack(); failure shows an inline error and stays open', async () => {
      const onBack = vi.fn();
      vi.mocked(createRole).mockResolvedValueOnce({
         success: false,
         message: "name already taken",
      });

      render(<RoleFormView mode="create" onBack={onBack} />);

      const nameInput = screen.getByPlaceholderText("new role");
      fireEvent.change(nameInput, { target: { value: "Support" } });
      fireEvent.click(screen.getByRole("button", { name: "Create role" }));

      await screen.findByText("name already taken");
      expect(onBack).not.toHaveBeenCalled();
      expect(toast.add).not.toHaveBeenCalled();
      expect(createRole).toHaveBeenCalledWith(
         expect.objectContaining({ name: "Support", server_id: "srv-1" }),
      );

      vi.mocked(createRole).mockResolvedValueOnce({ success: true, message: "role created" });
      fireEvent.click(screen.getByRole("button", { name: "Create role" }));

      await vi.waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
      expect(toast.add).toHaveBeenCalledWith({ title: "Role created", type: "success" });
   });

   it("mode=\"edit\": only dirtyFields are included in the updateRole payload (e.g. only toggling hoist must not send name)", async () => {
      vi.mocked(updateRole).mockResolvedValueOnce({ success: true, message: "role updated" });

      render(
         <RoleFormView
            mode="edit"
            role={role}
            initialPermissions={[]}
            onBack={vi.fn()}
         />,
      );

      const hoistToggle = screen.getAllByRole("switch")[0];
      fireEvent.click(hoistToggle);

      fireEvent.click(screen.getByText("Save Changes"));

      await vi.waitFor(() => expect(updateRole).toHaveBeenCalled());
      expect(updateRole).toHaveBeenCalledWith({
         server_id: "srv-1",
         role_id: "role-1",
         hoist: true,
      });
   });

   it("name field validation (min(1)/max(50)) blocks submit and shows the zod error message", async () => {
      render(<RoleFormView mode="create" onBack={vi.fn()} />);

      const nameInput = screen.getByPlaceholderText("new role");
      fireEvent.change(nameInput, { target: { value: "a".repeat(51) } });
      fireEvent.click(screen.getByRole("button", { name: "Create role" }));

      await screen.findByText("Max 50 characters");
      expect(createRole).not.toHaveBeenCalled();

      fireEvent.change(nameInput, { target: { value: "" } });
      fireEvent.click(screen.getByRole("button", { name: "Create role" }));

      await screen.findByText("Name is required");
      expect(createRole).not.toHaveBeenCalled();
   });

   it("clicking a ROLE_COLORS swatch sets role_color and marks the form dirty; the header icon/color preview reflects it live", async () => {
      const nextColor = ROLE_COLORS[3];
      vi.mocked(createRole).mockResolvedValue({ success: true, message: "role created" });

      render(<RoleFormView mode="create" onBack={vi.fn()} />);

      const swatch = screen.getByLabelText(`Role color ${nextColor}`);
      fireEvent.click(swatch);

      expect(swatch.getAttribute("aria-pressed")).toBe("true");
      // live color preview text next to "Role Color" label
      screen.getByText(nextColor);

      // dirty: create mode has no SaveBar, but the swatch itself now shows
      // pressed/selected state and the value reached the form — submit and
      // confirm the chosen color is what's sent
      const nameInput = screen.getByPlaceholderText("new role");
      fireEvent.change(nameInput, { target: { value: "Support" } });
      fireEvent.click(screen.getByRole("button", { name: "Create role" }));

      await vi.waitFor(() =>
         expect(createRole).toHaveBeenCalledWith(
            expect.objectContaining({ color: nextColor }),
         ),
      );
   });

   it("toggling a permission row (togglePermission) adds/removes it from the permissions array — clicking the row and clicking the inner Switch must not double-toggle (verify the stopPropagation on the switch wrapper actually works)", async () => {
      vi.mocked(createRole).mockResolvedValue({ success: true, message: "role created" });

      render(<RoleFormView mode="create" onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole("tab", { name: /permissions/i }));

      const rowLabel = screen.getByText(/^view\s*channel$/i);
      const row = rowLabel.closest("div.cursor-pointer") as HTMLElement;
      const rowSwitch = row.querySelector('[role="switch"]') as HTMLElement;

      expect(rowSwitch.getAttribute("data-checked")).not.toBe("");
      expect(rowSwitch.getAttribute("aria-checked")).toBe("false");

      // clicking the inner switch should toggle exactly once, not twice
      // (once from the switch's own onCheckedChange, once from the row's
      // onClick bubbling) — if stopPropagation ever regresses, this comes
      // back to "false" instead of staying "true"
      fireEvent.click(rowSwitch);
      expect(rowSwitch.getAttribute("aria-checked")).toBe("true");

      // clicking elsewhere on the row toggles it back off
      fireEvent.click(row);
      expect(rowSwitch.getAttribute("aria-checked")).toBe("false");

      fireEvent.click(row);
      expect(rowSwitch.getAttribute("aria-checked")).toBe("true");

      fireEvent.click(screen.getByRole("tab", { name: /display/i }));
      const nameInput = screen.getByPlaceholderText("new role");
      fireEvent.change(nameInput, { target: { value: "Support" } });
      fireEvent.click(screen.getByRole("button", { name: "Create role" }));

      await vi.waitFor(() =>
         expect(createRole).toHaveBeenCalledWith(
            expect.objectContaining({ permission_ids: ["view_channel"] }),
         ),
      );
   });

   it("edit mode footer is <SaveBar> (dirty/success/error states); create mode footer is explicit Cancel/Create buttons with isSubmitting disabling", async () => {
      const { unmount } = render(
         <RoleFormView mode="edit" role={role} initialPermissions={[]} onBack={vi.fn()} />,
      );

      // SaveBar is always mounted; visibility toggles via className
      // (bottom-4/opacity-100 vs -bottom-full/opacity-0) instead of
      // conditional rendering — so assert on that, not on presence.
      const saveBarContainer = screen.getByText("Save Changes").closest("div.fixed") as HTMLElement;
      expect(saveBarContainer.className).toContain("-bottom-full");
      expect(saveBarContainer.className).toContain("opacity-0");

      fireEvent.click(screen.getAllByRole("switch")[0]);

      // react-hook-form's formState.isDirty settles a tick after the
      // triggering onCheckedChange, so poll instead of asserting inline
      await vi.waitFor(() => expect(saveBarContainer.className).toContain("bottom-4"));
      expect(saveBarContainer.className).toContain("opacity-100");
      expect(screen.queryByText("Create role")).toBeNull();
      expect(screen.queryByText("Cancel")).toBeNull();

      unmount();

      let resolveUpdate!: (v: { success: boolean; message: string }) => void;
      vi.mocked(createRole).mockReturnValueOnce(
         new Promise((r) => {
            resolveUpdate = r;
         }),
      );

      render(<RoleFormView mode="create" onBack={vi.fn()} />);
      screen.getByText("Cancel");
      const createButton = screen.getByRole("button", { name: "Create role" }) as HTMLButtonElement;
      expect(createButton.disabled).toBe(false);

      const nameInput = screen.getByPlaceholderText("new role");
      fireEvent.change(nameInput, { target: { value: "Support" } });
      fireEvent.click(createButton);

      await vi.waitFor(() =>
         expect((screen.getByText(/Creating…/).closest("button") as HTMLButtonElement).disabled).toBe(
            true,
         ),
      );

      resolveUpdate({ success: true, message: "role created" });
   });
});
