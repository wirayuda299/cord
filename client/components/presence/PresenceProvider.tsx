"use client";

import { useRouter, usePathname } from "next/navigation";
import { mutate as globalMutate } from "swr";
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
  const router = useRouter();
  const pathname = usePathname();

  useWebSocket("", "", {
    onMessage: () => {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onEvent: (ev: any) => {
      if (ev && ev.type === "user_list") {
        setOnlineUserIds(ev.user_ids ?? []);
      } else if (ev && ev.type === "user_status") {
        if (ev.action === "connected") addOnlineUser(ev.user_id);
        else if (ev.action === "disconnected") removeOnlineUser(ev.user_id);
      } else if (ev && ev.type === "removed_from_server") {
        // Backend already busted the "servers" cache tag on its side
        // (read-your-own-writes only covers the actor who kicked/banned
        // us) — refresh so our own sidebar picks up the fresh list, and
        // bounce out if we're currently sitting inside that server.
        if (pathname?.startsWith(`/${ev.server_id}`)) {
          alert(
            ev.reason === "banned"
              ? "You were banned from this server."
              : "You were kicked from this server.",
          );
          router.push("/direct-messages");
        }
        router.refresh();
      } else if (ev && ev.type === "friend_accepted") {
        // Only the accepter's own request response updates their UI —
        // the requester (us, here) gets nothing else, so nudge both the
        // server-rendered friends list and the client-cached pending list.
        router.refresh();
        globalMutate("/api/friends");
      }
    },
  });

  return null;
}
