// components/sidebar/server/ChannelList.tsx
//
// Why (Smoke): category expand/collapse via the shared Zustand
// selectedCategory, permission-gated edit-channel trigger.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChannelList from "@/components/sidebar/server/ChannelList";
import { useAppStore } from "@/stores/store";
import type { GroupedChannels } from "@/lib/queries/channels";

afterEach(() => {
   cleanup();
});

beforeEach(() => {
   useAppStore.setState({ selectedCategory: null });
});

vi.mock("next/navigation", () => ({
   useParams: () => ({ id: "server-1" }),
}));

vi.mock("@/components/server/EditChannelDialog", () => ({
   default: () => <div>edit-channel-dialog</div>,
}));

function groupedChannels(overrides: Partial<GroupedChannels> = {}): GroupedChannels {
   return {
      server: { id: "server-1", name: "My Server", created_by: "user-1" },
      uncategorized: [],
      categories: [],
      ...overrides,
   };
}

describe("ChannelList (sidebar)", () => {
   it("clicking a category header toggles its channel list open/closed via chooseCategory; clicking the already-open category closes it (category?.id === cat.id ? null : cat)", () => {
      const category = {
         id: "cat-1",
         name: "Text Channels",
         server_id: "server-1",
         created_by: "user-1",
         channels: [
            {
               id: "chan-1",
               name: "general",
               channel_type: "text",
               server_id: "server-1",
               topic: "",
               created_by: "user-1",
            },
         ],
      };

      render(
         <ChannelList
            channels={groupedChannels({ categories: [category] })}
            hasPerm={false}
         />,
      );

      // closed by default — the nested channel isn't rendered
      expect(screen.queryByText("general")).toBeNull();

      fireEvent.click(screen.getByText("Text Channels"));

      expect(useAppStore.getState().selectedCategory?.id).toBe("cat-1");
      expect(screen.queryByText("general")).not.toBeNull();

      // clicking the already-open category closes it again
      fireEvent.click(screen.getByText("Text Channels"));

      expect(useAppStore.getState().selectedCategory).toBeNull();
      expect(screen.queryByText("general")).toBeNull();
   });

   it("the per-channel settings gear (opens EditChannelDialog) only renders when hasPerm is true", () => {
      const uncategorized = [
         {
            id: "chan-1",
            name: "general",
            channel_type: "text",
            server_id: "server-1",
            topic: "",
            created_by: "user-1",
         },
      ];

      const { container, rerender } = render(
         <ChannelList channels={groupedChannels({ uncategorized })} hasPerm={false} />,
      );

      expect(container.querySelector("svg.lucide-settings")).toBeNull();

      rerender(<ChannelList channels={groupedChannels({ uncategorized })} hasPerm={true} />);

      expect(container.querySelector("svg.lucide-settings")).not.toBeNull();
   });
});
