// components/server/EditChannelDialog.tsx
//
// Why: same shape family as CreateChannel.tsx, but the channel-type picker
// becomes read-only (edit can't change type) — a real behavioral
// difference worth its own quick check, not identical shape.

import EditChannelDialog from "@/components/server/EditChannelDialog";
import { Dialog } from "@/components/ui/dialog";
import { updateChannel } from "@/lib/actions/channels";
import { toast } from "@/components/ui/toast";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/channels", () => ({
   updateChannel: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
   toast: { add: vi.fn() },
}));

afterEach(() => {
   cleanup();
});

beforeEach(() => {
   vi.mocked(updateChannel).mockResolvedValue({ success: true, message: "Channel updated" });
});

const channel = {
   id: "chan-1",
   name: "general",
   channel_type: "text",
   topic: "chit chat",
};

function renderDialog() {
   return render(
      <Dialog defaultOpen modal={false}>
         <EditChannelDialog channel={channel} serverID="srv-1" categoryID="cat-1" />
      </Dialog>,
   );
}

describe("EditChannelDialog", () => {
   it("form is pre-filled with channel.name/channel.topic", () => {
      renderDialog();

      expect(screen.getByPlaceholderText("# channel-name")).toHaveProperty("value", "general");
      expect(
         screen.getByPlaceholderText("What's this channel about?"),
      ).toHaveProperty("value", "chit chat");
   });

   it("the channel-type list is entirely aria-disabled/cursor-not-allowed — clicking a different type never changes selection", () => {
      renderDialog();

      // DialogContent renders into a portal (document.body), not under
      // render()'s own container
      const typeOptions = document.querySelectorAll('[aria-disabled]');
      expect(typeOptions.length).toBeGreaterThan(0);
      typeOptions.forEach((opt) => {
         expect(opt.className).toContain("cursor-not-allowed");
      });

      // the pre-selected type (text) is the highlighted one
      const selected = screen.getByText("Text").closest('[aria-disabled]');
      expect(selected?.className).toContain("border-discord-brand");

      // clicking a different type is a no-op — still highlighted the same way
      fireEvent.click(screen.getByText("Audio"));
      const audioOption = screen.getByText("Audio").closest('[aria-disabled]');
      expect(audioOption?.className).not.toContain("border-discord-brand");
      expect(selected?.className).toContain("border-discord-brand");
   });

   it("successful update shows a toast (no reset — the dialog doesn't clear the form after success)", async () => {
      renderDialog();

      const nameInput = screen.getByPlaceholderText("# channel-name") as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: "renamed" } });
      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() =>
         expect(updateChannel).toHaveBeenCalledWith({
            channelId: "chan-1",
            name: "renamed",
            topic: "chit chat",
            categoryId: "cat-1",
            serverId: "srv-1",
         }),
      );
      await waitFor(() =>
         expect(toast.add).toHaveBeenCalledWith({
            title: "Channel updated",
            type: "success",
         }),
      );
      // form stays filled with the edited value, unlike CreateChannel's reset()
      expect(nameInput.value).toBe("renamed");
   });

   it("shows the error toast when update fails", async () => {
      vi.mocked(updateChannel).mockResolvedValue({
         success: false,
         message: "name taken",
      });
      renderDialog();

      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() =>
         expect(toast.add).toHaveBeenCalledWith({ title: "name taken", type: "error" }),
      );
   });
});
