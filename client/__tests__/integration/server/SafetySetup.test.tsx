// components/server/SafetySetup.tsx
//
// Why: loads defaults via the already-unit-tested getSafetySetup,
// radio-card + toggle-row state, live summary card, submit success/error.

import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SafetySetup from "@/components/server/SafetySetup";
import { getSafetySetup } from "@/lib/api/safety_rules";
import { updateSafetySetup } from "@/lib/actions/servers";

afterEach(() => {
   cleanup();
   vi.useRealTimers();
});

vi.mock("@/lib/api/safety_rules", () => ({
   getSafetySetup: vi.fn(),
}));

vi.mock("@/lib/actions/servers", () => ({
   updateSafetySetup: vi.fn(),
}));

beforeEach(() => {
   vi.clearAllMocks();
   // default: resolves to no data, so the effect is a harmless no-op unless
   // a test overrides it
   vi.mocked(getSafetySetup).mockResolvedValue({ error: "not configured", data: null });
});

// "Current Configuration" summary values duplicate the option-card labels
// verbatim (e.g. both show "Highest"), so plain screen.getByText is
// ambiguous for those — scope to the summary card specifically.
function summaryCard() {
   return screen.getByText("Current Configuration").parentElement as HTMLElement;
}

describe("SafetySetup", () => {
   it("on mount, a successful getSafetySetup call resets the form to the fetched values", async () => {
      vi.mocked(getSafetySetup).mockResolvedValue({
         error: null,
         data: {
            level: "high",
            content_filter: "everyone",
            require_2_fa: true,
            dm_spam_filter: false,
            default_notification: "all_messages",
         },
      });

      render(<SafetySetup serverId="srv-1" />);

      await waitFor(() => {
         expect(within(summaryCard()).getByText("High")).not.toBeNull();
      });
      expect(within(summaryCard()).getByText("Scan all messages")).not.toBeNull();
      expect(within(summaryCard()).getByText("All messages")).not.toBeNull();

      const switches = screen.getAllByRole("switch");
      expect(switches[0].getAttribute("aria-checked")).toBe("true"); // require2FA
      expect(switches[1].getAttribute("aria-checked")).toBe("false"); // dmSpamFilter
   });

   it("an error result from getSafetySetup leaves the form at DEFAULT_VALUES (doesn't call reset)", async () => {
      vi.mocked(getSafetySetup).mockResolvedValue({ error: "boom", data: null });

      render(<SafetySetup serverId="srv-1" />);

      await waitFor(() => expect(getSafetySetup).toHaveBeenCalled());

      // DEFAULT_VALUES: low / no_role / only_mentions / require2FA=false / dmSpamFilter=true
      expect(within(summaryCard()).getByText("Low")).not.toBeNull();
      expect(
         within(summaryCard()).getByText("Scan messages from roleless members"),
      ).not.toBeNull();
      expect(within(summaryCard()).getByText("Only @mentions")).not.toBeNull();

      const switches = screen.getAllByRole("switch");
      expect(switches[0].getAttribute("aria-checked")).toBe("false");
      expect(switches[1].getAttribute("aria-checked")).toBe("true");
   });

   it("selecting a different verification-level/content-filter/notification OptionCard updates the summary card live", async () => {
      render(<SafetySetup serverId="srv-1" />);
      await waitFor(() => expect(getSafetySetup).toHaveBeenCalled());

      fireEvent.click(
         screen.getByText("Must have a verified phone number on their account"),
      );
      expect(within(summaryCard()).getByText("Highest")).not.toBeNull();

      fireEvent.click(
         screen.getByText(
            "No automatic filtering — moderators handle everything manually",
         ),
      );
      expect(
         within(summaryCard()).getByText("Don't scan any messages"),
      ).not.toBeNull();

      fireEvent.click(
         screen.getByText("Members are notified for every message by default"),
      );
      expect(within(summaryCard()).getByText("All messages")).not.toBeNull();
   });

   it('"Require 2FA"/"DM Spam Filter" switches update both the toggle and the summary', async () => {
      render(<SafetySetup serverId="srv-1" />);
      await waitFor(() => expect(getSafetySetup).toHaveBeenCalled());

      const switches = screen.getAllByRole("switch");
      expect(within(summaryCard()).getByText("No")).not.toBeNull(); // 2FA off by default

      fireEvent.click(switches[0]);
      expect(switches[0].getAttribute("aria-checked")).toBe("true");
      expect(within(summaryCard()).getByText("Yes")).not.toBeNull();

      expect(within(summaryCard()).getByText("Enabled")).not.toBeNull(); // dmSpamFilter on by default
      fireEvent.click(switches[1]);
      expect(switches[1].getAttribute("aria-checked")).toBe("false");
      expect(within(summaryCard()).getByText("Disabled")).not.toBeNull();
   });

   it('successful submit calls updateSafetySetup, shows "Safety settings saved!", auto-clears after 3s', async () => {
      vi.mocked(updateSafetySetup).mockResolvedValue({
         success: true,
         message: "ok",
      });
      vi.useFakeTimers();

      render(<SafetySetup serverId="srv-1" />);
      // flush the mount effect's getSafetySetup call under fake timers
      await act(async () => {
         await vi.advanceTimersByTimeAsync(0);
      });

      const switches = screen.getAllByRole("switch");
      fireEvent.click(switches[0]); // dirty the form

      fireEvent.submit(screen.getByText("Save Changes").closest("form")!);
      await act(async () => {
         await vi.advanceTimersByTimeAsync(0);
         await Promise.resolve();
         await Promise.resolve();
      });

      expect(updateSafetySetup).toHaveBeenCalledWith(
         "srv-1",
         expect.objectContaining({ require2FA: true }),
      );
      // SaveBar's success branch always renders the fixed "Changes saved!"
      // caption — it doesn't surface submitStatus.message the way the error
      // branch does — so that's the visible signal a successful save leaves.
      expect(screen.getByText("Changes saved!")).not.toBeNull();

      await act(async () => {
         await vi.advanceTimersByTimeAsync(3000);
      });

      expect(screen.queryByText("Changes saved!")).toBeNull();
   });

   it("failed submit shows the error message and keeps the form dirty", async () => {
      vi.mocked(updateSafetySetup).mockResolvedValue({
         success: false,
         message: "Could not save safety settings",
      });

      render(<SafetySetup serverId="srv-1" />);
      await waitFor(() => expect(getSafetySetup).toHaveBeenCalled());

      const switches = screen.getAllByRole("switch");
      fireEvent.click(switches[0]);

      fireEvent.submit(screen.getByText("Save Changes").closest("form")!);

      await screen.findByText("Could not save safety settings");
      // still dirty: the Retry/Reset error bar is shown, not the "Save Changes" idle bar
      expect(screen.queryByText("Save Changes")).toBeNull();
      expect(screen.getByText("Retry")).not.toBeNull();
      expect(screen.getByText("Reset")).not.toBeNull();
   });
});
