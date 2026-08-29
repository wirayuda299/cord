import Image from "next/image";
import { UserRound } from "lucide-react";

import ChatList from "@/components/chat/ChatList";
import { getConversationById } from "@/lib/queries/conversations";
import { getAllMessagesByChannelId } from "@/lib/queries/messages";
import { auth } from "@clerk/nextjs/server";
import { unauthorized } from "next/navigation";
import OpenConversationsButton from "@/components/direct-messages/OpenConversationsButton";

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
  const { userId } = await auth()

  if (!userId) return unauthorized()
  const { channel_id } = await params;

  const [messages, conversation] = await Promise.all([
    getAllMessagesByChannelId(channel_id),
    getConversationById(channel_id),
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
      <div className="w-full bg-surface-content h-dvh overflow-hidden flex flex-col">
        <header className="h-14 shrink-0 px-2.5 sm:px-4 shadow gap-2 sm:gap-3 border-b border-gray-600/50 flex items-center">
          <OpenConversationsButton />
          <div className="flex size-8 items-center justify-center rounded-full bg-discord-brand/70 text-sm font-semibold text-white overflow-hidden shrink-0">
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

        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatList
            serverOwner=""
            currentUser={userId}
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

      </div>
    </phantom-ui>
  );
}
