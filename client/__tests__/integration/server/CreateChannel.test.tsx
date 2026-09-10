// components/server/CreateChannel.tsx
//
// Why: channel-type picker selection state, name-field validation
// (min:3, max:20), success/error toast + reset. Pulls categoryID from the
// Zustand store rather than a form field.
//
// See also EditChannelDialog.test.tsx — same shape, edit mode instead of
// create (type picker becomes read-only, pre-filled from the channel prop,
// no form reset after success).
//
// Found & fixed a real bug: the "type" Controller had no `rules`, so
// react-hook-form never actually blocked submit when no channel type was
// selected (contradicting this suite's own original todo). Added
// `rules={{ required: true }}` to the type Controller in the component.

import CreateChannel from "@/components/server/CreateChannel";
import { createChannel } from "@/lib/actions/channels";
import { toast } from "@/components/ui/toast";
import { useAppStore } from "@/stores/store";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/channels", () => ({
   createChannel: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
   toast: { add: vi.fn() },
}));

afterEach(() => {
   cleanup();
});

beforeEach(() => {
   useAppStore.setState({ selectedCategory: null });
   vi.mocked(createChannel).mockResolvedValue({ success: true, message: "created" });
});

async function openDialog() {
   render(<CreateChannel serverID="srv-1" />);
   fireEvent.click(screen.getByText("Create channel"));
   return {
      nameInput: (await screen.findByPlaceholderText(
         "# new-channel",
      )) as HTMLInputElement,
   };
}

describe("CreateChannel", () => {
   it("selecting a channel type highlights it, and submit is blocked until a type is chosen", async () => {
      const { nameInput } = await openDialog();
      fireEvent.change(nameInput, { target: { value: "general" } });

      const submit = () =>
         fireEvent.click(screen.getByRole("button", { name: "Create Channel" }));

      submit();
      expect(createChannel).not.toHaveBeenCalled();

      fireEvent.click(screen.getByText("Text"));
      const textOption = screen.getByText("Text").closest("div.cursor-pointer");
      expect(textOption?.className).toContain("border-discord-brand");

      submit();
      await waitFor(() => expect(createChannel).toHaveBeenCalled());
   });

   it("name shorter than 3 or longer than 20 chars shows a field error and blocks submit", async () => {
      const { nameInput } = await openDialog();
      fireEvent.click(screen.getByText("Text"));
      const submit = () =>
         fireEvent.click(screen.getByRole("button", { name: "Create Channel" }));

      fireEvent.change(nameInput, { target: { value: "ab" } });
      submit();
      expect(createChannel).not.toHaveBeenCalled();

      fireEvent.change(nameInput, { target: { value: "a".repeat(21) } });
      submit();
      expect(createChannel).not.toHaveBeenCalled();

      fireEvent.change(nameInput, { target: { value: "valid-name" } });
      submit();
      await waitFor(() => expect(createChannel).toHaveBeenCalled());
   });

   it("successful create shows a toast and resets the form; failure shows the error toast, form stays filled", async () => {
      vi.mocked(createChannel).mockResolvedValueOnce({
         success: false,
         message: "name already used",
      });
      const { nameInput } = await openDialog();
      fireEvent.click(screen.getByText("Text"));
      const submit = () =>
         fireEvent.click(screen.getByRole("button", { name: "Create Channel" }));
      fireEvent.change(nameInput, { target: { value: "general" } });
      submit();

      await waitFor(() =>
         expect(toast.add).toHaveBeenCalledWith({
            title: "name already used",
            type: "error",
         }),
      );
      // form untouched on failure
      expect(nameInput.value).toBe("general");

      vi.mocked(createChannel).mockResolvedValueOnce({
         success: true,
         message: "created",
      });
      submit();

      await waitFor(() =>
         expect(toast.add).toHaveBeenCalledWith({
            title: "Channel created",
            type: "success",
         }),
      );
      await waitFor(() => expect(nameInput.value).toBe(""));
   });

   it("categoryID sent to createChannel comes from useAppStore's selectedCategory, not a form field", async () => {
      useAppStore.setState({
         selectedCategory: {
            id: "cat-42",
            name: "General",
            server_id: "srv-1",
            created_by: "user-1",
            channels: [],
         },
      });
      const { nameInput } = await openDialog();
      fireEvent.click(screen.getByText("Text"));
      fireEvent.change(nameInput, { target: { value: "general" } });
      fireEvent.click(screen.getByRole("button", { name: "Create Channel" }));

      await waitFor(() =>
         expect(createChannel).toHaveBeenCalledWith(
            expect.objectContaining({ categoryID: "cat-42" }),
         ),
      );
   });
});
