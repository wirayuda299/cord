// components/server/profile.tsx
//
// Why: banner-gradient picker + icon upload + private-toggle + dirty-
// tracking save bar, same shape family as EditPerServerProfileDialog.tsx
// but for the server itself (different endpoint, worth its own coverage
// since a bug in one wouldn't be caught by the other's tests).

import type { ReactElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SWRConfig } from "swr";
import ServerProfile from "@/components/server/profile";
import getServerById from "@/lib/api/server";
import { uploadImage } from "@/lib/actions/images";
import { updateServer } from "@/lib/actions/servers";
import { toast } from "@/components/ui/toast";

afterEach(() => {
   cleanup();
   vi.useRealTimers();
});

vi.mock("next/navigation", () => ({
   useParams: () => ({ id: "srv-1" }),
}));

vi.mock("@/lib/api/server", () => ({
   default: vi.fn(),
}));

vi.mock("@/lib/actions/images", () => ({
   uploadImage: vi.fn(),
}));

vi.mock("@/lib/actions/servers", () => ({
   updateServer: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
   toast: { add: vi.fn() },
}));

const mockAttached = {
   attachedFiles: [] as { id: string; file: File; preview: string }[],
   addFiles: vi.fn(),
   removeFile: vi.fn(),
   errors: [] as string[],
   isDragging: false,
   onDragOver: vi.fn(),
   onDragLeave: vi.fn(),
   onDrop: vi.fn(),
};

vi.mock("@/hooks/useAttachedFiles", () => ({
   useAttachedFiles: () => mockAttached,
}));

beforeEach(() => {
   vi.clearAllMocks();
   mockAttached.attachedFiles = [];
   mockAttached.errors = [];
   mockAttached.isDragging = false;
});

const serverDetail = {
   name: "My Server",
   logo: "https://i.pravatar.cc/150?img=5",
   banner_colors: ["#ff4d8d", "#ff9ecb"],
   private: true,
   description: "A cool place",
   online_count: 3,
};

function renderIsolated(ui: ReactElement) {
   return render(
      <SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>,
   );
}

function nameInput() {
   return screen.getByPlaceholderText("server name...") as HTMLInputElement;
}

// the save bar's "Careful! you have unsaved changes!" text is always in the
// DOM — only its container's visibility classes toggle with isDirty — so
// check those classes rather than text presence.
function isSaveBarVisible() {
   return screen.getByRole("status").classList.contains("bottom-4");
}

describe("ServerProfile", () => {
   it("getServerById result resets the form (name/icon/banner/description/private) on load", async () => {
      vi.mocked(getServerById).mockResolvedValue(serverDetail);

      renderIsolated(<ServerProfile />);

      await waitFor(() => expect(nameInput().value).toBe("My Server"));
      expect(
         (screen.getByPlaceholderText(
            "Tell people about your server...",
         ) as HTMLTextAreaElement).value,
      ).toBe("A cool place");
      expect(
         screen
            .getByLabelText("Banner gradient #ff4d8d to #ff9ecb")
            .getAttribute("aria-pressed"),
      ).toBe("true");
      expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("true");
      // reset() sets the new baseline, so the form isn't considered dirty
      expect(isSaveBarVisible()).toBe(false);
   });

   it("selecting a gradient swatch sets banner and marks the form dirty; the preview panel reflects the selected gradient live", async () => {
      vi.mocked(getServerById).mockResolvedValue(serverDetail);
      const { container } = renderIsolated(<ServerProfile />);
      await waitFor(() => expect(nameInput().value).toBe("My Server"));

      expect(isSaveBarVisible()).toBe(false);

      fireEvent.click(
         screen.getByLabelText("Banner gradient #1e90ff to #70d6ff"),
      );

      expect(isSaveBarVisible()).toBe(true);
      expect(
         screen
            .getByLabelText("Banner gradient #1e90ff to #70d6ff")
            .getAttribute("aria-pressed"),
      ).toBe("true");
      // preview panel's inline gradient style now uses the newly selected colors
      expect(container.innerHTML).toContain("#1e90ff");
   });

   it("attaching an icon file shows its preview + remove button; removing it calls removeFile", async () => {
      vi.mocked(getServerById).mockResolvedValue(serverDetail);
      const file = new File(["x"], "icon.png", { type: "image/png" });
      mockAttached.attachedFiles = [{ id: "1", file, preview: "blob:preview-url" }];

      renderIsolated(<ServerProfile />);
      await waitFor(() => expect(nameInput().value).toBe("My Server"));

      const removeButton = screen.getByLabelText("Remove selected icon");
      expect(removeButton).not.toBeNull();

      fireEvent.click(removeButton);
      expect(mockAttached.removeFile).toHaveBeenCalledWith(0);
   });

   it("submit only sends dirtyFields via updateServer's fields param", async () => {
      vi.mocked(getServerById).mockResolvedValue(serverDetail);
      vi.mocked(updateServer).mockResolvedValue({ success: true, message: "ok" });

      renderIsolated(<ServerProfile />);
      await waitFor(() => expect(nameInput().value).toBe("My Server"));

      fireEvent.change(nameInput(), { target: { value: "New Name" } });

      fireEvent.click(screen.getByText("Save Changes"));

      await waitFor(() => expect(updateServer).toHaveBeenCalled());
      const call = vi.mocked(updateServer).mock.calls[0][0];
      expect(call.fields).toEqual({ name: true });
   });

   it("icon upload failure shows an error toast and aborts the submit before calling updateServer", async () => {
      vi.mocked(getServerById).mockResolvedValue(serverDetail);
      const file = new File(["x"], "icon.png", { type: "image/png" });
      mockAttached.attachedFiles = [{ id: "1", file, preview: "blob:preview-url" }];
      vi.mocked(uploadImage).mockResolvedValue({
         success: false,
         message: "Upload failed",
      });

      renderIsolated(<ServerProfile />);
      await waitFor(() => expect(nameInput().value).toBe("My Server"));

      fireEvent.change(nameInput(), { target: { value: "New Name" } });
      fireEvent.click(screen.getByText("Save Changes"));

      await waitFor(() =>
         expect(toast.add).toHaveBeenCalledWith({
            title: "Upload failed",
            type: "error",
         }),
      );
      expect(updateServer).not.toHaveBeenCalled();
   });

   it('toggling "Private profile" switch updates form state and marks dirty', async () => {
      vi.mocked(getServerById).mockResolvedValue({ ...serverDetail, private: false });
      renderIsolated(<ServerProfile />);
      await waitFor(() => expect(nameInput().value).toBe("My Server"));

      const toggle = screen.getByRole("switch");
      expect(toggle.getAttribute("aria-checked")).toBe("false");
      expect(isSaveBarVisible()).toBe(false);

      fireEvent.click(toggle);

      expect(toggle.getAttribute("aria-checked")).toBe("true");
      expect(isSaveBarVisible()).toBe(true);
   });

   it("save-bar states: unsaved / success (auto-clears after 3s) / error (Retry/Reset)", async () => {
      vi.mocked(getServerById).mockResolvedValue(serverDetail);
      vi.mocked(updateServer).mockResolvedValueOnce({
         success: false,
         message: "Could not save",
      });

      renderIsolated(<ServerProfile />);
      await waitFor(() => expect(nameInput().value).toBe("My Server"));

      fireEvent.change(nameInput(), { target: { value: "New Name" } });
      await waitFor(() => expect(isSaveBarVisible()).toBe(true));

      fireEvent.click(screen.getByText("Save Changes"));
      await screen.findByText("Could not save");
      expect(screen.getByText("Retry")).not.toBeNull();
      expect(screen.getByText("Reset")).not.toBeNull();

      vi.mocked(updateServer).mockResolvedValueOnce({ success: true, message: "ok" });
      vi.useFakeTimers();

      fireEvent.click(screen.getByText("Retry"));
      await act(async () => {
         await vi.advanceTimersByTimeAsync(0);
      });

      expect(screen.getByText("Changes saved!")).not.toBeNull();

      await act(async () => {
         await vi.advanceTimersByTimeAsync(3000);
      });
      expect(screen.queryByText("Changes saved!")).toBeNull();
   });
});
