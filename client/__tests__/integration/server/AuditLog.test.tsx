// components/server/AuditLog.tsx
//
// Why: full loading/error/empty/data state machine, query+category
// filtering, date-grouping, per-row expand/collapse gated on whether the
// entry actually has changes.

import AuditLog from "@/components/server/AuditLog";
import { getAuditLogs } from "@/lib/actions/audit";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/audit", () => ({
   getAuditLogs: vi.fn(),
}));

afterEach(() => {
   cleanup();
});

type RawChange = { field: string; before?: string; after?: string };
type RawEntry = {
   id: string;
   actor_name: string;
   actor_id: number;
   action_type: string;
   target: string;
   created_at: string;
   changes?: RawChange[];
};

function rawEntry(overrides: Partial<RawEntry> = {}): RawEntry {
   return {
      id: "e1",
      actor_name: "wira",
      actor_id: 1,
      action_type: "member_kicked",
      target: "bob",
      created_at: new Date().toISOString(),
      ...overrides,
   };
}

describe("AuditLog", () => {
   it("getAuditLogs success maps raw entries (category inference) and groups them by dateLabel", async () => {
      const today = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      vi.mocked(getAuditLogs).mockResolvedValue({
         success: true,
         message: "ok",
         data: [
            rawEntry({
               id: "e1",
               action_type: "channel_created",
               target: "#general",
               created_at: today.toISOString(),
            }),
            rawEntry({
               id: "e2",
               action_type: "invite_created",
               target: "invite link",
               created_at: yesterday.toISOString(),
            }),
         ],
      });

      render(<AuditLog serverId="srv-1" />);

      await screen.findByText("Today");
      expect(screen.getByText("Yesterday")).not.toBeNull();
      expect(screen.getByText(/created channel/)).not.toBeNull(); // channel_ prefix -> channel category verb
      expect(screen.getByText(/created invite/)).not.toBeNull(); // invite_ prefix -> invite category verb
   });

   it('!success or a thrown error shows the "Couldn\'t load the audit log" empty state', async () => {
      vi.mocked(getAuditLogs).mockResolvedValue({ success: false, message: "denied" });
      render(<AuditLog serverId="srv-1" />);

      await screen.findByText(/Couldn't load the audit log/);
   });

   it('a thrown/rejected getAuditLogs also shows the error empty state', async () => {
      vi.mocked(getAuditLogs).mockRejectedValue(new Error("network down"));
      render(<AuditLog serverId="srv-1" />);

      await screen.findByText(/Couldn't load the audit log/);
   });

   it("typing in the search box filters by actor.name (case-insensitive); category pills filter by category; both combine", async () => {
      vi.mocked(getAuditLogs).mockResolvedValue({
         success: true,
         message: "ok",
         data: [
            rawEntry({ id: "e1", actor_name: "Alice", action_type: "member_kicked" }),
            rawEntry({ id: "e2", actor_name: "Bob", action_type: "channel_created" }),
            rawEntry({ id: "e3", actor_name: "alina", action_type: "role_created" }),
         ],
      });

      render(<AuditLog serverId="srv-1" />);
      await screen.findByText("3 of 3 actions");

      fireEvent.change(screen.getByPlaceholderText("Filter by user..."), {
         target: { value: "ali" },
      });
      await waitFor(() => expect(screen.getByText("2 of 3 actions")).not.toBeNull());
      expect(screen.getByText("Alice")).not.toBeNull();
      expect(screen.getByText("alina")).not.toBeNull();
      expect(screen.queryByText("Bob")).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: "Role" }));
      await waitFor(() => expect(screen.getByText("1 of 3 actions")).not.toBeNull());
      expect(screen.getByText("alina")).not.toBeNull();
      expect(screen.queryByText("Alice")).toBeNull();
   });

   it("an entry row is only clickable/expandable when hasChanges — clicking a row with no changes does nothing", async () => {
      vi.mocked(getAuditLogs).mockResolvedValue({
         success: true,
         message: "ok",
         data: [rawEntry({ id: "e1", action_type: "member_kicked", changes: undefined })],
      });

      render(<AuditLog serverId="srv-1" />);
      const row = await screen.findByText(/kicked/);
      const button = row.closest("button") as HTMLButtonElement;
      expect(button.disabled).toBe(true);

      fireEvent.click(button);
      expect(screen.queryByText("Changes")).toBeNull();
   });

   it("expanding a row with changes renders each ChangeRow (before -> after diff)", async () => {
      vi.mocked(getAuditLogs).mockResolvedValue({
         success: true,
         message: "ok",
         data: [
            rawEntry({
               id: "e1",
               action_type: "role_updated",
               changes: [
                  { field: "name", before: "Old Name", after: "New Name" },
                  { field: "color", before: "#000000", after: "#ffffff" },
               ],
            }),
         ],
      });

      render(<AuditLog serverId="srv-1" />);
      const row = await screen.findByText(/updated role/);
      const button = row.closest("button") as HTMLButtonElement;
      expect(button.disabled).toBe(false);

      fireEvent.click(button);

      expect(screen.getByText("Changes")).not.toBeNull();
      expect(screen.getByText("Old Name")).not.toBeNull();
      expect(screen.getByText("New Name")).not.toBeNull();
      expect(screen.getByText("#000000")).not.toBeNull();
      expect(screen.getByText("#ffffff")).not.toBeNull();
   });

   it('header count text ("{filtered} of {total} actions") updates as filters change, and is hidden while status === "loading"', async () => {
      let resolveLogs!: (v: { success: boolean; message: string; data: RawEntry[] }) => void;
      vi.mocked(getAuditLogs).mockReturnValue(
         new Promise((res) => {
            resolveLogs = res;
         }),
      );

      render(<AuditLog serverId="srv-1" />);
      expect(screen.queryByText(/of .* actions?/)).toBeNull();

      resolveLogs({
         success: true,
         message: "ok",
         data: [rawEntry({ id: "e1" }), rawEntry({ id: "e2", actor_name: "Bob" })],
      });

      await screen.findByText("2 of 2 actions");
   });
});
