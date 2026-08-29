"use client";

import { useWebSocket } from "@/hooks/useWebsocket";
import { useAppStore } from "@/stores/store";

/**
 * App-wide presence socket, separate from the per-channel chat socket.
 * Connects with empty serverId/channelId, which the backend treats as a
 * global bucket (no membership check, see ServeWs) shared by every
 * connected client — so "online" here means "has the app open", not
 * "is in this channel/server right now".
 */
export default function PresenceProvider() {
  const setOnlineUserIds = useAppStore((s) => s.setOnlineUserIds);
  const addOnlineUser = useAppStore((s) => s.addOnlineUser);
  const removeOnlineUser = useAppStore((s) => s.removeOnlineUser);

  useWebSocket("", "", {
    onMessage: () => {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onEvent: (ev: any) => {
      if (ev && ev.type === "user_list") {
        setOnlineUserIds(ev.user_ids ?? []);
      } else if (ev && ev.type === "user_status") {
        if (ev.action === "connected") addOnlineUser(ev.user_id);
        else if (ev.action === "disconnected") removeOnlineUser(ev.user_id);
      }
    },
  });

  return null;
}
