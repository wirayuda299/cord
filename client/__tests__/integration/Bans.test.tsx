import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";
import { ReactElement } from "react";
import { getBans } from "@/lib/api/bans";
import Bans from "@/components/server/Bans";

afterEach(() => {
   cleanup();
});

vi.mock("@/lib/actions/servers", () => ({
   unbanMember: vi.fn(),
}));

vi.mock("date-fns", () => ({
   format: vi.fn(),
}));

vi.mock("@/lib/api/bans", () => ({
   getBans: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
   toast: { add: vi.fn() },
}));

function renderIsolated(ui: ReactElement) {
   return render(
      <SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>,
   );
}

const data = [
   {
      id: "ban-123",
      name: "wira",
      initials: "w",
      color: "red",
      reason: null,
      bannedAt: "12/11/2026",
      bannedBy: "agus",
   },

   {
      id: "ban-456",
      name: "yuda",
      initials: "w",
      color: "red",
      reason: null,
      bannedAt: "12/11/2026",
      bannedBy: "agus",
   },
];

describe("Bans component test", () => {
   it("should render banned members from fetch req", async () => {
      vi.mocked(getBans).mockResolvedValue(data);

      renderIsolated(<Bans serverId="srv" />);
      await screen.findByText("wira");
   });

   it("should filter banned members", async () => {
      vi.mocked(getBans).mockResolvedValue(data);

      renderIsolated(<Bans serverId="srv" />);

      // wait for the loading state to clear before the input even exists
      const filterInput = await screen.findByPlaceholderText(
         "Search banned members...",
      );
      fireEvent.change(filterInput, { target: { value: "yuda" } });

      await screen.findByText("yuda");
      expect(screen.queryByText("wira")).toBeNull();
   });

   it("should show empty state when there's no match member in query", async () => {
      vi.mocked(getBans).mockResolvedValue(data);

      renderIsolated(<Bans serverId="srv" />);

      // wait for the loading state to clear before the input even exists
      const filterInput = await screen.findByPlaceholderText(
         "Search banned members...",
      );
      fireEvent.change(filterInput, { target: { value: "smith" } });

      await screen.findByText("No matching bans");
   });

   it("should show empty state when no banned members", async () => {
      vi.mocked(getBans).mockResolvedValue([]);

      renderIsolated(<Bans serverId="srv" />);

      await screen.findByText("No banned members");
   });

   it("should clear search input when x button presses", async () => {
      vi.mocked(getBans).mockResolvedValue(data);

      renderIsolated(<Bans serverId="srv" />);

      const filterInput = await screen.findByPlaceholderText(
         "Search banned members...",
      );
      fireEvent.change(filterInput, { target: { value: "yuda" } });

      const el = await screen.findByTitle("clear");
      fireEvent.click(el);
      expect((filterInput as HTMLInputElement).value).toBe("");
   });
});
