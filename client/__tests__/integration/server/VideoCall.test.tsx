// components/server/VideoCall.tsx
//
// FLAGGED — high mocking cost. Real token-fetch-on-mount + error-toast
// logic exists, but it's wrapped in @livekit/components-react's full WebRTC
// component tree (LiveKitRoom, useTracks, GridLayout, etc.) — mocking that
// entire library just to reach the token-fetch branch is a large one-time
// cost for a small amount of first-party logic. Consider deferring this
// one to manual QA / e2e rather than RTL.

import { describe, it } from "vitest";

describe("VideoCall", () => {
   it.todo("renders PulseLoader until session exists and the token fetch resolves");
   it.todo(
      "a failed /api/get-participant-token fetch shows an error toast and stays on the loader (never sets token)",
   );
   it.todo(
      "LiveKitRoom's onDisconnected navigates to /${serverId} (only testable if LiveKitRoom itself is mocked to a stub that exposes/calls this prop)",
   );
});
