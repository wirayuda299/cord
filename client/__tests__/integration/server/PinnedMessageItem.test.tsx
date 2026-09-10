// components/server/PinnedMessageItem.tsx
//
// Why: delete-pin success/error toast, canDelete permission gate on the
// delete button's visibility.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PinnedMessageItem from "@/components/server/PinnedMessageItem";
import { deletePinnedMessage } from "@/lib/actions/messages";
import { toast } from "@/components/ui/toast";
import type { PinnedMessage } from "@/types/chat";

afterEach(() => {
   cleanup();
   vi.clearAllMocks();
});

vi.mock("@/lib/actions/messages", () => ({
   deletePinnedMessage: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
   toast: { add: vi.fn() },
}));

const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

const messages: PinnedMessage[] = [
   { id: "msg-1", username: "wira", content: "hello there", user_id: "u1" },
];

describe("PinnedMessageItem", () => {
   it("delete button (X) only renders per-item when canDelete is true", () => {
      const { rerender } = render(
         <PinnedMessageItem
            pinnedMessages={messages}
            canDelete={false}
            serverId="srv-1"
         />,
      );
      expect(screen.queryByRole("button")).toBeNull();

      rerender(
         <PinnedMessageItem
            pinnedMessages={messages}
            canDelete={true}
            serverId="srv-1"
         />,
      );
      expect(screen.getByRole("button")).not.toBeNull();
   });

   it("clicking delete calls deletePinnedMessage(id, serverId), shows success or error toast based on res.success, and e.stopPropagation() prevents the row's own click handler from also firing", async () => {
      vi.mocked(deletePinnedMessage).mockResolvedValueOnce({
         success: true,
         message: "Pin removed",
      });

      render(
         <PinnedMessageItem
            pinnedMessages={messages}
            canDelete={true}
            serverId="srv-1"
         />,
      );

      fireEvent.click(screen.getByRole("button"));

      await vi.waitFor(() =>
         expect(deletePinnedMessage).toHaveBeenCalledWith("msg-1", "srv-1"),
      );
      await vi.waitFor(() =>
         expect(toast.add).toHaveBeenCalledWith({
            title: "Pin removed",
            type: "success",
         }),
      );
      // the row itself has no matching DOM element to jump to, so if
      // stopPropagation failed to prevent the bubble, this would also warn
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      vi.mocked(deletePinnedMessage).mockResolvedValueOnce({
         success: false,
         message: "Could not remove pin",
      });
      fireEvent.click(screen.getByRole("button"));

      await vi.waitFor(() =>
         expect(toast.add).toHaveBeenCalledWith({
            title: "Could not remove pin",
            type: "error",
         }),
      );
   });

   it('clicking a pinned item without a matching DOM id present calls console.warn and does not throw (the "not found" branch)', () => {
      render(
         <PinnedMessageItem
            pinnedMessages={messages}
            canDelete={false}
            serverId="srv-1"
         />,
      );

      expect(() =>
         fireEvent.click(screen.getByText("hello there")),
      ).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
         "Message with ID msg-1 not found in DOM",
      );
   });
});
