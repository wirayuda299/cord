import { getAllFriends } from "@/lib/server/data/friends";
import { startConversation } from "@/lib/server/actions/conversations";
import { FriendListItem } from "@/lib/types/friends";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import Image from "next/image";

const online = true;

function FriendRow({ avatar_url, username, user_id }: FriendListItem) {
  return (
    <li className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-surface-hover group transition-colors cursor-pointer">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-discord-brand/70 flex items-center justify-center text-sm font-bold text-white">
            {avatar_url ? (
              <Image
                quality={50}
                className="object-cover size-full rounded-full"
                src={avatar_url}
                width={40}
                height={40}
                alt={username}
              />
            ) : (
              username.charAt(0).toUpperCase()
            )}
          </div>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar-secondary",
              online ? "bg-green-500" : "bg-zinc-500",
            )}
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100 truncate">
            {username}
          </p>
          <p className="text-xs text-zinc-500 truncate">
            {online ? "Online" : "Offline"}
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

export default async function AllFriends() {
  const allFriend = await getAllFriends("usr_001");

  if (allFriend && allFriend.length <= 0) return "No friend yet";
  return (
    <ul className="space-y-1">
      {allFriend?.map((f) => (
        <FriendRow key={f.friendship_id} {...f} />
      ))}
    </ul>
  );
}
