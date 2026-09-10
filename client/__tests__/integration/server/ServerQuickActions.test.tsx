// components/server/ServerQuickActions.tsx
//
// Why: reuse-existing-vs-create-new invite logic, copy-with-timed-feedback,
// conditional "Start Chatting" card.

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ServerQuickActions from "@/components/server/ServerQuickActions";
import { getAllInvitation } from "@/lib/api/invitation";
import { createInvitationCode } from "@/lib/actions/invitations";
import { copyText } from "@/lib/clipboard";
import type { Invitation } from "@/types/invitation";

afterEach(() => {
   cleanup();
   vi.useRealTimers();
});

vi.mock("@/lib/api/invitation", () => ({
   getAllInvitation: vi.fn(),
}));

vi.mock("@/lib/actions/invitations", () => ({
   createInvitationCode: vi.fn(),
}));

vi.mock("@/lib/clipboard", () => ({
   copyText: vi.fn().mockResolvedValue(true),
}));

beforeEach(() => {
   vi.clearAllMocks();
   vi.mocked(copyText).mockResolvedValue(true);
});

function invitation(overrides: Partial<Invitation>): Invitation {
   return {
      code: "abc123",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "u1",
      id: "inv-1",
      max_users: 10,
      uses: 0,
      server_id: "srv-1",
      username: "wira",
      server_name: "My Server",
      member_count: 1,
      online_count: 1,
      logo: null,
      banner_color: [],
      ...overrides,
   };
}

describe("ServerQuickActions", () => {
   it("reuses an existing invite with uses < max_users instead of creating a new one", async () => {
      vi.mocked(getAllInvitation).mockResolvedValue([
         invitation({ code: "reused-code", uses: 3, max_users: 10 }),
      ]);

      render(<ServerQuickActions serverId="srv-1" />);

      await screen.findByText(/reused-code/);
      expect(createInvitationCode).not.toHaveBeenCalled();
   });

   it("creates a new invite when no reusable one exists (string result shape)", async () => {
      vi.mocked(getAllInvitation).mockResolvedValue([
         invitation({ code: "full-code", uses: 10, max_users: 10 }),
      ]);
      vi.mocked(createInvitationCode).mockResolvedValue({
         success: true,
         message: "created",
         data: "new-code" as any,
      });

      render(<ServerQuickActions serverId="srv-1" />);

      await screen.findByText(/new-code/);
   });

   it("creates a new invite when no reusable one exists (nested {data:{code}} result shape)", async () => {
      vi.mocked(getAllInvitation).mockResolvedValue([]);
      vi.mocked(createInvitationCode).mockResolvedValue({
         success: true,
         message: "created",
         data: { data: { code: "nested-code" } } as any,
      });

      render(<ServerQuickActions serverId="srv-1" />);

      await screen.findByText(/nested-code/);
   });

   it("getAllInvitation failing sets linkError and shows it instead of the link", async () => {
      vi.mocked(getAllInvitation).mockRejectedValue(new Error("network error"));

      render(<ServerQuickActions serverId="srv-1" />);

      await screen.findByText("Failed to load invite link");
      expect(createInvitationCode).not.toHaveBeenCalled();
   });

   it("createInvitationCode failing sets linkError and shows it instead of the link", async () => {
      vi.mocked(getAllInvitation).mockResolvedValue([]);
      vi.mocked(createInvitationCode).mockResolvedValue({
         success: false,
         message: "Could not create invite",
      });

      render(<ServerQuickActions serverId="srv-1" />);

      await screen.findByText("Could not create invite");
   });

   it('copy button is disabled until a link exists; clicking it shows "Copied!" for 2s', async () => {
      vi.mocked(getAllInvitation).mockResolvedValue([
         invitation({ code: "abc123", uses: 0, max_users: 10 }),
      ]);

      render(<ServerQuickActions serverId="srv-1" />);

      const copyButton = screen.getByTitle("Copy invite link");
      expect(copyButton.hasAttribute("disabled")).toBe(true);

      await screen.findByText(/abc123/);
      expect(copyButton.hasAttribute("disabled")).toBe(false);

      vi.useFakeTimers();
      fireEvent.click(copyButton);

      await act(async () => {
         await vi.advanceTimersByTimeAsync(0);
      });
      expect(copyText).toHaveBeenCalled();
      expect(screen.getByText("Copied!")).not.toBeNull();

      await act(async () => {
         await vi.advanceTimersByTimeAsync(2000);
      });
      expect(screen.queryByText("Copied!")).toBeNull();
   });

   it('firstChannelId present renders the "Start Chatting" link card; absent renders the "No Channels Found" inactive card', async () => {
      vi.mocked(getAllInvitation).mockResolvedValue([]);
      vi.mocked(createInvitationCode).mockResolvedValue({
         success: true,
         message: "created",
         data: "code" as any,
      });

      const { rerender } = render(<ServerQuickActions serverId="srv-1" />);
      expect(screen.getByText("No Channels Found")).not.toBeNull();
      expect(screen.queryByText("Start Chatting")).toBeNull();

      rerender(
         <ServerQuickActions
            serverId="srv-1"
            firstChannelId="chan-1"
            firstChannelName="general"
         />,
      );
      expect(screen.getByText("Start Chatting")).not.toBeNull();
      expect(screen.getByText("Join #general")).not.toBeNull();
      expect(screen.queryByText("No Channels Found")).toBeNull();
   });
});
