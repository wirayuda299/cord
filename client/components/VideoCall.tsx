
"use client";

import "@livekit/components-styles";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  useTracks,
  RoomAudioRenderer,
  ControlBar,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";

export default function VideoCall({ room, serverId }: { room: string; serverId: string }) {
  const [token, setToken] = useState('');
  const router = useRouter();
  const id = useId()
  useEffect(() => {
    // TODO: return early if no user
    (async () => {
      try {
        const resp = await fetch(
          `/api/get-participant-token?room=${room}&username=wira${id}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        alert(e)
      }
    })();
  }, [room]);

  if (!token) return <p>Loading...</p>;

  return (
    <LiveKitRoom
      onDisconnected={() => {
        router.push(`/server/${serverId}`);
      }}
      video={true}
      audio={true}
      token={token}
      serverUrl={process.env.LIVEKIT_URL}
      data-lk-theme='default'
      className='fixed! inset-x-0 top-0 min-h-dvh md:min-h-screen overflow-y-auto z-50 md:static! md:z-0'
    >
      <MyVideoConference />
      <RoomAudioRenderer />
      <ControlBar />
    </LiveKitRoom>
  );
}

function MyVideoConference() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  return (
    <GridLayout
      tracks={tracks}
      style={{ height: "calc(100vh - var(--lk-control-bar-height))" }}
    >
      <ParticipantTile />
    </GridLayout>
  );
}
