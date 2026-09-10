// components/server/Invites.tsx
//
// Why: create-invite form toggle with clamped/preset max-uses input,
// delete with success/error toast, list-vs-empty-state.
//
// Found & fixed a real bug: handleCreate's early `return` inside the
// `if (res && !res.success)` branch skipped the trailing `setCreating(false)`
// entirely, so the create form stayed open on a validation-style failure
// but closed on a thrown error — contradicting this suite's own todo
// ("always closes the create form afterward, even on error"). Moved
// `setCreating(false)` into a `finally` block in the component.

import Invites from "@/components/server/Invites";
import { createInvitationCode } from "@/lib/actions/invitations";
import { deleteInvitationCode, getAllInvitation } from "@/lib/api/invitation";
import { toast } from "@/components/ui/toast";
import type { Invitation } from "@/types/invitation";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/invitations", () => ({
   createInvitationCode: vi.fn(),
}));

vi.mock("@/lib/api/invitation", () => ({
   getAllInvitation: vi.fn(),
   deleteInvitationCode: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
   toast: { add: vi.fn() },
}));

afterEach(() => {
   cleanup();
});

function renderIsolated(ui: ReactElement) {
   return render(<SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>);
}

function invitation(overrides: Partial<Invitation> = {}): Invitation {
   return {
      code: "abc123",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "user-1",
      id: "inv-1",
      max_users: 10,
      uses: 0,
      server_id: "srv-1",
      username: "wira",
      server_name: "My Server",
      member_count: 5,
      online_count: 1,
      logo: null,
      banner_color: [],
      ...overrides,
   };
}

describe("Invites", () => {
   it('clicking "Create Invite" toggles the inline CreateInviteForm; presets/typing set maxUsers', async () => {
      vi.mocked(getAllInvitation).mockResolvedValue([]);
      renderIsolated(<Invites serverID="srv-1" />);
      await screen.findByText("No invite links yet");

      expect(screen.queryByText("New Invite Link")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Create Invite" }));
      expect(screen.getByText("New Invite Link")).not.toBeNull();

      const numberInput = screen.getByRole("spinbutton") as HTMLInputElement;
      expect(numberInput.value).toBe("10"); // default

      fireEvent.click(screen.getByRole("button", { name: "25" }));
      expect(numberInput.value).toBe("25");

      fireEvent.change(numberInput, { target: { value: "500" } });
      expect(numberInput.value).toBe("255"); // clamped to max

      fireEvent.change(numberInput, { target: { value: "0" } });
      expect(numberInput.value).toBe("1"); // clamped to min

      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(screen.queryByText("New Invite Link")).toBeNull();
   });

   it('"Generate Link" calls createInvitationCode(serverID, maxUsers) and always closes the create form afterward', async () => {
      vi.mocked(getAllInvitation).mockResolvedValue([]);
      vi.mocked(createInvitationCode).mockResolvedValue({
         success: false,
         message: "limit reached",
      });
      renderIsolated(<Invites serverID="srv-1" />);
      await screen.findByText("No invite links yet");

      fireEvent.click(screen.getByRole("button", { name: "Create Invite" }));
      fireEvent.click(screen.getByRole("button", { name: "50" }));
      fireEvent.click(screen.getByRole("button", { name: "Generate Link" }));

      await waitFor(() => expect(createInvitationCode).toHaveBeenCalledWith("srv-1", 50));
      await waitFor(() =>
         expect(toast.add).toHaveBeenCalledWith({ title: "limit reached", type: "error" }),
      );
      // form closes even though the result was a failure
      await waitFor(() => expect(screen.queryByText("New Invite Link")).toBeNull());

      vi.mocked(createInvitationCode).mockResolvedValue({ success: true, message: "ok" });
      fireEvent.click(screen.getByRole("button", { name: "Create Invite" }));
      fireEvent.click(screen.getByRole("button", { name: "Generate Link" }));

      await waitFor(() =>
         expect(toast.add).toHaveBeenCalledWith({
            title: "Invitation code created",
            type: "success",
         }),
      );
      await waitFor(() => expect(screen.queryByText("New Invite Link")).toBeNull());
   });

   it("deleting an invite calls deleteInvitationCode, shows a success toast, or an error toast if it throws", async () => {
      vi.mocked(getAllInvitation).mockResolvedValue([invitation({ code: "delete-me" })]);
      vi.mocked(deleteInvitationCode).mockResolvedValue(undefined);
      renderIsolated(<Invites serverID="srv-1" />);

      await screen.findByText(/delete-me/);
      // Trash2 icon button has no accessible name — locate it by its icon class
      const trashButton = Array.from(document.querySelectorAll("button")).find((b) =>
         b.querySelector("svg.lucide-trash2"),
      ) as HTMLButtonElement;

      fireEvent.click(trashButton);

      await waitFor(() => expect(deleteInvitationCode).toHaveBeenCalledWith("delete-me"));
      await waitFor(() =>
         expect(toast.add).toHaveBeenCalledWith({ title: "Code deleted", type: "success" }),
      );

      vi.mocked(deleteInvitationCode).mockRejectedValueOnce(new Error("network error"));
      fireEvent.click(trashButton);

      await waitFor(() =>
         expect(toast.add).toHaveBeenCalledWith({ title: "network error", type: "error" }),
      );
   });

   it('empty state ("No invite links yet") only shows when data.length === 0 && !creating', async () => {
      vi.mocked(getAllInvitation).mockResolvedValue([]);
      renderIsolated(<Invites serverID="srv-1" />);

      await screen.findByText("No invite links yet");

      fireEvent.click(screen.getByRole("button", { name: "Create Invite" }));
      expect(screen.queryByText("No invite links yet")).toBeNull();
   });

   it('UsageBar/InviteRow mark an invite "Full" (red styling + badge) when uses >= max_users', async () => {
      vi.mocked(getAllInvitation).mockResolvedValue([
         invitation({ code: "full-one", uses: 10, max_users: 10 }),
         invitation({ code: "not-full", uses: 2, max_users: 10 }),
      ]);
      renderIsolated(<Invites serverID="srv-1" />);

      await screen.findByText(/full-one/);
      // exactly one "Full" badge — for the invite where uses >= max_users
      expect(screen.getAllByText("Full")).toHaveLength(1);
   });
});
