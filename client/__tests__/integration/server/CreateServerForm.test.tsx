// components/server/CreateServerForm.tsx
//
// Why: combines the already-unit-tested useAttachedFiles hook with a real
// form submit — good "wiring" test between two previously-isolated pieces.

import CreateServerForm from "@/components/server/CreateServerForm";
import { createServer } from "@/lib/actions/servers";
import { toast } from "@/components/ui/toast";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/servers", () => ({
   createServer: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
   toast: { add: vi.fn() },
}));

afterEach(() => {
   cleanup();
   vi.unstubAllGlobals();
});

beforeEach(() => {
   vi.mocked(createServer).mockResolvedValue({ success: true, message: "created" });

   // jsdom doesn't implement these — see ChatForm.test.tsx for the same pattern
   URL.createObjectURL = vi.fn((file: Blob) => `blob:${(file as File).name}`);
   URL.revokeObjectURL = vi.fn();
   let counter = 0;
   vi.stubGlobal("crypto", { randomUUID: vi.fn(() => `uuid-${++counter}`) });
});

async function openDialog() {
   render(<CreateServerForm />);
   fireEvent.click(screen.getByRole("button"));
   return {
      nameInput: (await screen.findByPlaceholderText(
         "Enter server name",
      )) as HTMLInputElement,
   };
}

function makeImage(name = "icon.png") {
   return new File(["content"], name, { type: "image/png" });
}

describe("CreateServerForm", () => {
   it("handleSubmit no-ops on an empty/whitespace-only name (never calls createServer)", async () => {
      const { nameInput } = await openDialog();
      const submit = () =>
         fireEvent.click(screen.getByRole("button", { name: "Create" }));

      // empty — blocked by the zod min(3) resolver before handleSubmit even runs
      submit();
      expect(createServer).not.toHaveBeenCalled();

      // 3 spaces passes zod's min(3), but the component's own .trim() guard
      // still blocks it
      fireEvent.change(nameInput, { target: { value: "   " } });
      submit();
      expect(createServer).not.toHaveBeenCalled();

      fireEvent.change(nameInput, { target: { value: "My Server" } });
      submit();
      await waitFor(() => expect(createServer).toHaveBeenCalledWith("My Server"));
   });

   it("successful createServer shows a success toast (dialog does not auto-close)", async () => {
      const { nameInput } = await openDialog();
      fireEvent.change(nameInput, { target: { value: "My Server" } });
      fireEvent.click(screen.getByRole("button", { name: "Create" }));

      await waitFor(() =>
         expect(toast.add).toHaveBeenCalledWith({ title: "Server created", type: "success" }),
      );
      // still in the DOM — no DialogClose was triggered on success
      expect(screen.getByPlaceholderText("Enter server name")).not.toBeNull();
   });

   it("createServer returning {success:false} shows the error toast with res.message", async () => {
      vi.mocked(createServer).mockResolvedValue({
         success: false,
         message: "name already taken",
      });
      const { nameInput } = await openDialog();
      fireEvent.change(nameInput, { target: { value: "My Server" } });
      fireEvent.click(screen.getByRole("button", { name: "Create" }));

      await waitFor(() =>
         expect(toast.add).toHaveBeenCalledWith({
            title: "name already taken",
            type: "error",
         }),
      );
   });

   it("dropping/selecting a file shows the icon preview instead of the upload placeholder", async () => {
      await openDialog();
      expect(screen.getByText("Upload")).not.toBeNull();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [makeImage()] } });

      await screen.findByAltText("Server icon");
      expect(screen.queryByText("Upload")).toBeNull();
   });

   it('drag-over/drag-leave toggles the dashed-border "drop here" visual state', async () => {
      await openDialog();
      const dropZone = screen.getByText("Upload").closest("label") as HTMLElement;
      const dashedBorder = dropZone.querySelector(".border-dashed") as HTMLElement;
      const hasActiveDragClass = () =>
         dashedBorder.className.split(/\s+/).includes("border-indigo-400");

      expect(hasActiveDragClass()).toBe(false);
      expect(screen.queryByText("Drop here")).toBeNull();

      fireEvent.dragOver(dropZone);
      expect(hasActiveDragClass()).toBe(true);
      expect(screen.getByText("Drop here")).not.toBeNull();

      fireEvent.dragLeave(dropZone);
      expect(hasActiveDragClass()).toBe(false);
      expect(screen.getByText("Upload")).not.toBeNull();
   });
});
