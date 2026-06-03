import ChatList from "@/components/chat/ChatList";
import { getChannelById } from "@/lib/server/data/channel_detail";
import { getAllThreadMessages } from "@/lib/server/data/threads";
export default async function ThreadDetail({
  params,
}: {
  params: Promise<{ id: string; channel_id: string; thread_id: string }>
}) {
  const { thread_id, id, channel_id } = await params;

  const messages = await getAllThreadMessages(thread_id)
  const channel = await getChannelById(channel_id)

  if (channel && 'error' in channel) {
    return <p className="text-red-600 text-sm">failed to fetch channel</p>
  }

  return (
    <ChatList
      thread_id={thread_id}
      channel={channel}
      historyMessages={messages}
      serverId={id}
      variant="server"
    />
  )
}
