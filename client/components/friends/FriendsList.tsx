"use client";

import { startConversation } from "@/lib/actions/conversations";
import { FriendListItem } from "@/types/friends";
import { MessageSquare } from "lucide-react";
import { Avatar, getInitials, avatarColorFromSeed } from "@/components/ui/avatar";
import { useAppStore } from "@/stores/store";

function FriendRow({ avatar_url, username, user_id }: FriendListItem) {
  const isOnline = useAppStore((s) => s.onlineUserIds.has(user_id));

  return (
    <li className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-surface-hover group transition-colors cursor-pointer">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar
          src={avatar_url}
          alt={username}
          fallback={getInitials(username)}
          fallbackStyle={{ background: avatarColorFromSeed(user_id) }}
          indicator={isOnline ? "online" : "offline"}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100 truncate">
            {username}
          </p>
          <p className="text-xs text-zinc-500">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <form action={startConversation}>
          <input type="hidden" name="targeted_user_id" value={user_id} />
          <button
            type="submit"
            title={`Message ${username}`}
            className="w-8 h-8 cursor-pointer flex items-center justify-center rounded-full bg-surface-raised hover:bg-surface-hover text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <MessageSquare size={15} />
          </button>
        </form>
      </div>
    </li>
  );
}

export default function FriendsList({
  friends,
  filter = "all",
}: {
  friends: FriendListItem[];
  filter?: "all" | "online";
}) {
  const onlineUserIds = useAppStore((s) => s.onlineUserIds);
  const visible =
    filter === "online"
      ? friends.filter((f) => onlineUserIds.has(f.user_id))
      : friends;

  if (visible.length <= 0) {
    return filter === "online" ? "No friends online" : "No friend yet";
  }

  return (
    <ul className="space-y-1">
      {visible.map((f) => (
        <FriendRow key={f.friendship_id} {...f} />
      ))}
    </ul>
  );
}
