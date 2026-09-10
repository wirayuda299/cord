// components/server/VideoCall.tsx
//
// Real first-party logic (token-fetch-on-mount + error-toast + navigate-on-
// disconnect) is wrapped in @livekit/components-react's full WebRTC
// component tree. Rather than pulling in the real library (and the real
// "livekit-client" package, which touches WebRTC/media globals jsdom
// doesn't provide), every LiveKit-facing module is stubbed so this test
// only exercises VideoCall's own logic.

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VideoCall from "@/components/server/VideoCall";
import { toast } from "@/components/ui/toast";
import { useSession } from "@clerk/nextjs";

afterEach(() => {
   cleanup();
});

vi.mock("@livekit/components-styles", () => ({}));

vi.mock("livekit-client", () => ({
   Track: { Source: { Camera: "camera", ScreenShare: "screen_share" } },
}));

let onDisconnectedHandler: (() => void) | undefined;

vi.mock("@livekit/components-react", () => ({
   LiveKitRoom: ({ children, onDisconnected, token }: any) => {
      onDisconnectedHandler = onDisconnected;
      return (
         <div data-testid="livekit-room" data-token={token}>
            {children}
            <button onClick={onDisconnected}>simulate-disconnect</button>
         </div>
      );
   },
   GridLayout: ({ children }: any) => <div>{children}</div>,
   ParticipantTile: () => <div>participant-tile</div>,
   useTracks: () => [],
   RoomAudioRenderer: () => null,
   ControlBar: () => null,
}));

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
   useRouter: () => ({ push: pushMock }),
}));

vi.mock("@clerk/nextjs", () => ({
   useSession: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
   toast: { add: vi.fn() },
}));

beforeEach(() => {
   vi.clearAllMocks();
   onDisconnectedHandler = undefined;
   vi.mocked(useSession).mockReturnValue({
      session: { user: { username: "wira" } },
   } as any);
   vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
         json: () => Promise.resolve({ token: "tok-123" }),
      }),
   );
});

afterEach(() => {
   vi.unstubAllGlobals();
});

describe("VideoCall", () => {
   it("renders PulseLoader until session exists and the token fetch resolves", async () => {
      let resolveFetch: (v: any) => void;
      vi.stubGlobal(
         "fetch",
         vi.fn().mockReturnValue(
            new Promise((resolve) => {
               resolveFetch = resolve;
            }),
         ),
      );

      render(<VideoCall room="room-1" serverId="srv-1" />);

      expect(screen.queryByTestId("livekit-room")).toBeNull();

      resolveFetch!({ json: () => Promise.resolve({ token: "tok-123" }) });

      await screen.findByTestId("livekit-room");
   });

   it("a failed /api/get-participant-token fetch shows an error toast and stays on the loader (never sets token)", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

      render(<VideoCall room="room-1" serverId="srv-1" />);

      await waitFor(() =>
         expect(toast.add).toHaveBeenCalledWith({
            title: "network down",
            type: "error",
         }),
      );
      expect(screen.queryByTestId("livekit-room")).toBeNull();
   });

   it("LiveKitRoom's onDisconnected navigates to /${serverId}", async () => {
      render(<VideoCall room="room-1" serverId="srv-42" />);

      const room = await screen.findByTestId("livekit-room");
      expect(room.getAttribute("data-token")).toBe("tok-123");

      fireEvent.click(screen.getByText("simulate-disconnect"));

      expect(pushMock).toHaveBeenCalledWith("/srv-42");
   });
});
