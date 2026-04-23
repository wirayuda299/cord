import { Hash } from "lucide-react"

import ChatList from "@/components/chat/ChatList"
import { cn } from "@/lib/utils"
import { getChannelById } from "@/lib/server/data/channels"
import { getAllMessagesByChannelId } from "@/lib/server/data/messages"
import MembersButton from "./_components/MemberButton"
import Notification from "./_components/Notification"
import PinnedMessages from "./_components/PinnedMessages"
import SearchForm from "./_components/SearchForm"

function isApiError(value: unknown): value is { error: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "string"
  )
}

export default async function ChannelDetail({
  params,
}: {
  params: Promise<{ channel_id: string; id: string }>
}) {
  const { channel_id, id } = await params

  const [messages, channel] = await Promise.all([
    getAllMessagesByChannelId(channel_id),
    getChannelById(channel_id)
  ])

  if (isApiError(messages)) {
    return "Failed to fetch messages"
  }

  if (isApiError(channel)) {
    return "Failed to fetch channel"
  }


  return (
    <div className="w-full bg-surface-content h-screen overflow-hidden flex flex-col">
      <header className="h-14 shrink-0 px-2.5 shadow gap-4 border-b border-gray-600/50 flex items-center">
        <div className="flex items-center gap-2   w-full">
          <Hash size={18} className="text-gray-400" />
          <h1
            className={cn(
              "text-sm font-semibold text-white pr-5 border-gray-600 capitalize",
              channel.topic && "border-r",
            )}
          >
            {channel?.name}
          </h1>
          {channel.topic && (
            <p className="text-xs truncate text-gray-400 hidden md:block capitalize">
              {channel?.topic}
            </p>
          )}
        </div>
        <Notification />
        <PinnedMessages channelId={channel_id} />
        <MembersButton />
        <SearchForm />
      </header>

      <ChatList channel={channel} serverId={id} historyMessages={messages ?? []} />
    </div>
  )
}
