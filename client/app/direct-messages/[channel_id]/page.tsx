import Image from "next/image";
import { UserRound } from "lucide-react";

import ChatList from "@/components/chat/ChatList";
import { getConversationById } from "@/lib/server/data/conversations";
import { getAllMessagesByChannelId } from "@/lib/server/data/messages";

const CURRENT_USER_ID = "usr_001";
const DM_SCOPE_ID = "dm";

function isApiError(value: unknown): value is { error: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "string"
  );
}

export default async function DirectMessageDetail({
  params,
}: {
  params: Promise<{ channel_id: string }>;
}) {
  const { channel_id } = await params;

  const [messages, conversation] = await Promise.all([
    getAllMessagesByChannelId(channel_id),
    getConversationById(channel_id, CURRENT_USER_ID),
  ]);

  if (isApiError(messages)) {
    return "Failed to fetch messages";
  }

  if (isApiError(conversation)) {
    return "Failed to fetch conversation";
  }

  const displayName = conversation.other_username || conversation.name;

  return (
    <phantom-ui>
      <div className="w-full bg-surface-content h-screen overflow-hidden flex flex-col">
        <header className="h-14 shrink-0 px-4 shadow gap-3 border-b border-gray-600/50 flex items-center">
          <div className="flex size-8 items-center justify-center rounded-full bg-discord-brand/70 text-sm font-semibold text-white overflow-hidden">
            {conversation.other_avatar_url ? (
              <Image
                src={conversation.other_avatar_url}
                width={32}
                height={32}
                alt={displayName}
                className="size-full rounded-full object-cover"
              />
            ) : (
              <UserRound size={18} />
            )}
          </div>
          <h1 className="text-sm font-semibold text-white truncate">
            {displayName}
          </h1>
        </header>

        <ChatList
          variant="dm"
          channel={conversation}
          serverId={DM_SCOPE_ID}
          historyMessages={messages ?? []}
          recipient={{
            username: displayName,
            avatar_url: conversation.other_avatar_url,
          }}
        />

      </div>
    </phantom-ui>
  );
}
