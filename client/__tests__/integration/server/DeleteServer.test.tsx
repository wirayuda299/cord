// components/server/DeleteServer.tsx
//
// Why: a destructive-action confirmation gate — exact-name-match
// requirement before the delete button becomes enabled. High value: a bug
// here silently makes server deletion too easy or impossible.

import DeleteServer from "@/components/server/DeleteServer";
import { deleteServer } from "@/lib/actions/servers";
import { useRouter } from "next/navigation";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/servers", () => ({
   deleteServer: vi.fn(),
}));

vi.mock("next/navigation", () => ({
   useRouter: vi.fn(),
}));

afterEach(() => {
   cleanup();
});

function setup() {
   const push = vi.fn();
   const refresh = vi.fn();
   vi.mocked(useRouter).mockReturnValue({
      push,
      refresh,
   } as unknown as ReturnType<typeof useRouter>);

   const utils = render(<DeleteServer serverId="srv-1" serverName="My Server" />);

   return {
      push,
      refresh,
      input: screen.getByPlaceholderText("Enter server name...") as HTMLInputElement,
      button: screen.getByRole("button", { name: /delete server/i }) as HTMLButtonElement,
      ...utils,
   };
}

describe("DeleteServer", () => {
   // Note: the component's own todo says "extra space... keeps it disabled",
   // but the real code trims BOTH confirmName and serverName before
   // comparing, so surrounding whitespace is intentionally forgiving —
   // tested as-is below, only a wrong-case/partial match stays disabled.
   it("keeps the submit button disabled until confirmName exactly matches serverName (trimmed)", () => {
      const { input, button } = setup();

      expect(button.disabled).toBe(true);

      fireEvent.change(input, { target: { value: "My Serve" } }); // partial match
      expect(button.disabled).toBe(true);

      fireEvent.change(input, { target: { value: "my server" } }); // wrong case
      expect(button.disabled).toBe(true);

      // both sides are trimmed, so surrounding whitespace still matches
      fireEvent.change(input, { target: { value: " My Server " } });
      expect(button.disabled).toBe(false);

      fireEvent.change(input, { target: { value: "My Server" } });
      expect(button.disabled).toBe(false);
   });

   it("submitting while not matched is a no-op (form submit guarded by isMatched)", () => {
      const { container } = setup();
      const form = container.querySelector("form") as HTMLFormElement;

      fireEvent.submit(form);

      expect(deleteServer).not.toHaveBeenCalled();
   });

   it('successful delete calls router.push("/direct-messages") then router.refresh()', async () => {
      vi.mocked(deleteServer).mockResolvedValue({ success: true, message: "deleted" });
      const { push, refresh, input, button } = setup();

      fireEvent.change(input, { target: { value: "My Server" } });
      fireEvent.click(button);

      await waitFor(() => expect(deleteServer).toHaveBeenCalledWith("srv-1"));
      await waitFor(() => expect(push).toHaveBeenCalledWith("/direct-messages"));
      expect(refresh).toHaveBeenCalled();
   });

   it("shows the inline error message and re-enables the form when deleteServer returns {success:false}", async () => {
      vi.mocked(deleteServer).mockResolvedValue({
         success: false,
         message: "You are not the owner",
      });
      const { push, input, button } = setup();

      fireEvent.change(input, { target: { value: "My Server" } });
      fireEvent.click(button);

      await screen.findByText("You are not the owner");
      expect(push).not.toHaveBeenCalled();
      expect(button.disabled).toBe(false);
      expect(input.disabled).toBe(false);
   });

   it("disables the input and submit button while loading", async () => {
      let resolveDelete!: (v: { success: boolean; message: string }) => void;
      vi.mocked(deleteServer).mockReturnValue(
         new Promise((res) => {
            resolveDelete = res;
         }),
      );
      const { input, button } = setup();

      fireEvent.change(input, { target: { value: "My Server" } });
      fireEvent.click(button);

      await waitFor(() => expect(input.disabled).toBe(true));
      expect(button.disabled).toBe(true);

      resolveDelete({ success: true, message: "deleted" });
   });
});
