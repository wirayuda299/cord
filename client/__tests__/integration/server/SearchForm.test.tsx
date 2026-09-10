// components/server/SearchForm.tsx
//
// Why: search submit with loading/error/results states, matchMedia-based
// mobile detection, click-outside-to-close.

import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SearchForm from "@/components/server/SearchForm";
import { searchMessage } from "@/lib/api/messages";

afterEach(() => {
   cleanup();
});

vi.mock("@/lib/api/messages", () => ({
   searchMessage: vi.fn(),
}));

// jsdom doesn't implement matchMedia — matches:true = desktop (md+),
// matches:false = mobile (the component's own !mql.matches inversion).
function mockMatchMedia(matches: boolean) {
   const mql = {
      matches,
      media: "(min-width: 768px)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
   };
   vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue(mql),
   );
   return mql;
}

beforeEach(() => {
   vi.clearAllMocks();
   mockMatchMedia(true); // desktop by default
});

afterEach(() => {
   vi.unstubAllGlobals();
});

// SearchForm's isExpanded is a controlled prop — a tiny stateful wrapper
// mirrors how the real parent owns that state, so toggling it via the
// component's own callbacks is observable.
function Wrapper({ initialExpanded = true }: { initialExpanded?: boolean }) {
   const [isExpanded, setIsExpanded] = useState(initialExpanded);
   return (
      <SearchForm
         serverID="srv-1"
         channelID="chan-1"
         isExpanded={isExpanded}
         setIsExpanded={setIsExpanded}
      />
   );
}

function getInput() {
   return screen.getByPlaceholderText("search message...") as HTMLInputElement;
}

describe("SearchForm", () => {
   it("submitting an empty/whitespace query does not call searchMessage", async () => {
      render(<Wrapper />);

      fireEvent.change(getInput(), { target: { value: "   " } });
      fireEvent.click(screen.getByLabelText("Search messages"));

      await new Promise((r) => setTimeout(r, 0));
      expect(searchMessage).not.toHaveBeenCalled();
   });

   it("submitting a query shows a loading spinner then the results", async () => {
      let resolveSearch: (v: unknown) => void;
      vi.mocked(searchMessage).mockReturnValue(
         new Promise((resolve) => {
            resolveSearch = resolve;
         }) as any,
      );

      render(<Wrapper />);
      fireEvent.change(getInput(), { target: { value: "hello" } });
      fireEvent.click(screen.getByLabelText("Search messages"));

      await screen.findByText("Searching messages...");

      await act(async () => {
         resolveSearch([
            {
               id: "m1",
               content: "hello world",
               thread_id: null,
               username: "wira",
               avatar_url: "",
            },
         ]);
      });

      await screen.findByText("hello world");
      expect(searchMessage).toHaveBeenCalledWith("hello", "srv-1", "chan-1");
   });

   it('submitting a query with no matches shows "No messages found matching query."', async () => {
      vi.mocked(searchMessage).mockResolvedValue([]);

      render(<Wrapper />);
      fireEvent.change(getInput(), { target: { value: "nothing" } });
      fireEvent.click(screen.getByLabelText("Search messages"));

      await screen.findByText("No messages found matching query.");
   });

   it("a failed search shows the error message", async () => {
      vi.mocked(searchMessage).mockRejectedValue(new Error("search failed"));

      render(<Wrapper />);
      fireEvent.change(getInput(), { target: { value: "boom" } });
      fireEvent.click(screen.getByLabelText("Search messages"));

      await screen.findByText("search failed");
   });

   it("clicking outside the search container closes the results dropdown and collapses isExpanded", async () => {
      vi.mocked(searchMessage).mockResolvedValue([]);

      render(<Wrapper initialExpanded={true} />);
      fireEvent.change(getInput(), { target: { value: "hi" } });
      fireEvent.click(screen.getByLabelText("Search messages"));
      await screen.findByText("No messages found matching query.");

      fireEvent.mouseDown(document.body);

      expect(screen.queryByText("No messages found matching query.")).toBeNull();
      // isExpanded flipped back to false: the input's flex wrapper collapses
      // to the icon-only "hidden" state
      expect(getInput().closest("div")?.className).toContain("hidden");
   });

   it("on mobile, tapping the search icon while collapsed expands the input instead of submitting", async () => {
      mockMatchMedia(false); // mobile

      render(<Wrapper initialExpanded={false} />);

      fireEvent.click(screen.getByLabelText("Search messages"));

      await waitFor(() =>
         expect(getInput().closest("div")?.className).not.toContain("hidden"),
      );
      expect(searchMessage).not.toHaveBeenCalled();
   });

   it("on desktop, tapping the search icon always submits", async () => {
      mockMatchMedia(true); // desktop
      vi.mocked(searchMessage).mockResolvedValue([]);

      render(<Wrapper initialExpanded={false} />);
      fireEvent.change(getInput(), { target: { value: "hey" } });
      fireEvent.click(screen.getByLabelText("Search messages"));

      await waitFor(() => expect(searchMessage).toHaveBeenCalledWith("hey", "srv-1", "chan-1"));
   });

   it("clicking the clear (X) button resets the query, closes results, and refocuses the input on desktop", async () => {
      vi.mocked(searchMessage).mockResolvedValue([]);

      render(<Wrapper initialExpanded={true} />);
      const input = getInput();
      fireEvent.change(input, { target: { value: "hey" } });
      fireEvent.click(screen.getByLabelText("Search messages"));
      await screen.findByText("No messages found matching query.");

      const clearButton = screen
         .getAllByRole("button")
         .find((b) => b.closest("form") && !b.getAttribute("aria-label"));
      fireEvent.click(clearButton!);

      expect(input.value).toBe("");
      expect(screen.queryByText("No messages found matching query.")).toBeNull();
      expect(document.activeElement).toBe(input);
   });

   it("clicking the clear (X) button collapses the bar on mobile", async () => {
      mockMatchMedia(false); // mobile
      vi.mocked(searchMessage).mockResolvedValue([]);

      render(<Wrapper initialExpanded={true} />);
      const input = getInput();
      fireEvent.change(input, { target: { value: "hey" } });

      const clearButton = screen
         .getAllByRole("button")
         .find((b) => b.closest("form") && !b.getAttribute("aria-label"));
      fireEvent.click(clearButton!);

      await waitFor(() =>
         expect(getInput().closest("div")?.className).toContain("hidden"),
      );
   });
});
