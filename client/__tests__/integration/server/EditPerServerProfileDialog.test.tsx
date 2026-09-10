// components/server/EditPerServerProfileDialog.tsx
//
// Why: dirty-field-only patch construction, avatar upload tied into form
// state, save-bar state machine with auto-clearing success toast (fake
// timers).

import EditPerServerProfileDialog from "@/components/server/EditPerServerProfileDialog";
import { getServerProfile } from "@/lib/api/serverProfile";
import { updateServerProfile } from "@/lib/actions/serverProfile";
import { uploadImage } from "@/lib/actions/images";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/serverProfile", () => ({
   getServerProfile: vi.fn(),
}));

vi.mock("@/lib/actions/serverProfile", () => ({
   updateServerProfile: vi.fn(),
}));

vi.mock("@/lib/actions/images", () => ({
   uploadImage: vi.fn(),
}));

afterEach(() => {
   cleanup();
   vi.unstubAllGlobals();
   vi.useRealTimers();
});

beforeEach(() => {
   URL.createObjectURL = vi.fn((file: Blob) => `blob:${(file as File).name}`);
   URL.revokeObjectURL = vi.fn();
   let counter = 0;
   vi.stubGlobal("crypto", { randomUUID: vi.fn(() => `uuid-${++counter}`) });
   vi.mocked(updateServerProfile).mockResolvedValue({ success: true, message: "saved" });
});

function renderIsolated(ui: ReactElement) {
   return render(<SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>);
}

function profile(overrides: Partial<{ username: string; avatar: string; avatar_id: string; bio: string }> = {}) {
   return {
      username: "wira",
      avatar: "https://example.com/avatar.png",
      avatar_id: "asset-1",
      bio: "hello there",
      ...overrides,
   };
}

async function openDialog(data = profile()) {
   vi.mocked(getServerProfile).mockResolvedValue(data);
   renderIsolated(<EditPerServerProfileDialog serverId="srv-1" />);
   fireEvent.click(screen.getByText("Edit Per-server profile"));

   const usernameInput = (await screen.findByPlaceholderText(
      "Your server display name…",
   )) as HTMLInputElement;
   await waitFor(() => expect(usernameInput.value).toBe(data.username));

   return {
      usernameInput,
      bioInput: screen.getByPlaceholderText(
         "Tell people a bit about yourself…",
      ) as HTMLTextAreaElement,
   };
}

function makeImage(name = "avatar.png") {
   return new File(["content"], name, { type: "image/png" });
}

describe("EditPerServerProfileDialog", () => {
   it("on load, getServerProfile result populates the form via form.reset — form starts non-dirty", async () => {
      const data = profile({ username: "alice", bio: "my bio" });
      const { usernameInput, bioInput } = await openDialog(data);

      expect(usernameInput.value).toBe("alice");
      expect(bioInput.value).toBe("my bio");

      const bar = document.querySelector(".absolute.bottom-0.inset-x-0") as HTMLElement;
      expect(bar.className.split(/\s+/)).toContain("translate-y-full");
   });

   it("the save bar is hidden until isDirty or submitStatus is set", async () => {
      const { usernameInput } = await openDialog();
      const bar = document.querySelector(".absolute.bottom-0.inset-x-0") as HTMLElement;

      expect(bar.className.split(/\s+/)).toContain("translate-y-full");

      fireEvent.change(usernameInput, { target: { value: "alice2" } });

      expect(bar.className.split(/\s+/)).toContain("translate-y-0");
      expect(screen.getByText(/unsaved changes/)).not.toBeNull();
   });

   it("only dirtyFields are included in the patch (changing only bio must not send username)", async () => {
      const { bioInput } = await openDialog(profile({ username: "wira", bio: "old bio" }));

      fireEvent.change(bioInput, { target: { value: "new bio" } });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => expect(updateServerProfile).toHaveBeenCalled());
      const call = vi.mocked(updateServerProfile).mock.calls[0][0];
      expect(call.payload).toEqual({ bio: "new bio" });
      expect(call.payload.username).toBeUndefined();
   });

   it("attaching a file uploads it via uploadImage on submit and includes avatar/avatar_asset_id in the patch; removing resets the avatar field", async () => {
      vi.mocked(uploadImage).mockResolvedValue({
         success: true,
         message: "ok",
         data: { url: "https://cdn.test/new-avatar.png", public_id: "asset-2" },
      });
      const data = profile({ avatar: "https://example.com/original.png" });
      await openDialog(data);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [makeImage()] } });

      // attaching the file marks the avatar field dirty -> save bar visible
      await waitFor(() => expect(screen.getByText(/unsaved changes/)).not.toBeNull());

      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => expect(uploadImage).toHaveBeenCalled());
      await waitFor(() =>
         expect(updateServerProfile).toHaveBeenCalledWith(
            expect.objectContaining({
               payload: expect.objectContaining({
                  avatar: "https://cdn.test/new-avatar.png",
                  avatar_asset_id: "asset-2",
               }),
            }),
         ),
      );
   });

   it("removing the attached file resets the avatar form field back to the loaded value", async () => {
      const data = profile({ avatar: "https://example.com/original.png" });
      await openDialog(data);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [makeImage()] } });

      const avatarImg = await screen.findByAltText("avatar");
      expect((avatarImg as HTMLImageElement).src).toContain("blob:avatar.png");

      fireEvent.click(screen.getByRole("button", { name: "Remove" }));

      await waitFor(() =>
         expect((screen.getByAltText("avatar") as HTMLImageElement).src).toContain(
            "original.png",
         ),
      );
   });

   it('updateServerProfile failure shows the error save-bar state with Retry/Reset; success shows "Saved successfully!" then auto-clears after 3s', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.mocked(updateServerProfile).mockResolvedValueOnce({
         success: false,
         message: "server exploded",
      });
      const { usernameInput } = await openDialog();

      fireEvent.change(usernameInput, { target: { value: "renamed" } });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await vi.waitFor(() => expect(screen.getByText("server exploded")).not.toBeNull());
      expect(screen.getByRole("button", { name: "Retry" })).not.toBeNull();
      expect(screen.getByRole("button", { name: "Reset" })).not.toBeNull();

      vi.mocked(updateServerProfile).mockResolvedValueOnce({ success: true, message: "saved" });
      fireEvent.click(screen.getByRole("button", { name: "Retry" }));

      await vi.waitFor(() => expect(screen.getByText("Saved successfully!")).not.toBeNull());

      await vi.advanceTimersByTimeAsync(3000);
      await vi.waitFor(() => expect(screen.queryByText("Saved successfully!")).toBeNull());
   });

   it("character counters for username (32) and bio (190) turn yellow past their warning thresholds (28/170)", async () => {
      const { usernameInput, bioInput } = await openDialog();

      fireEvent.change(usernameInput, { target: { value: "a".repeat(27) } });
      expect(screen.getByText("27/32").className).not.toContain("text-yellow-400");
      fireEvent.change(usernameInput, { target: { value: "a".repeat(28) } });
      expect(screen.getByText("28/32").className).toContain("text-yellow-400");

      fireEvent.change(bioInput, { target: { value: "a".repeat(169) } });
      expect(screen.getByText("169/190").className).not.toContain("text-yellow-400");
      fireEvent.change(bioInput, { target: { value: "a".repeat(170) } });
      expect(screen.getByText("170/190").className).toContain("text-yellow-400");
   });
});
