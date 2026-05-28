import ChatList from "@/components/chat/ChatList";
import { getChannelById } from "@/lib/server/data/channel_detail";
import { getAllMessagesByChannelId } from "@/lib/server/data/messages";

export default async function ChannelDetail({
  params,
}: {
  params: Promise<{ channel_id: string; id: string }>;
}) {

  const { channel_id, id } = await params
  const channel = await getChannelById(channel_id)

  if (channel && 'error' in channel) {
    return <p className="text-red-600 text-sm">failed to fetch channel</p>
  }

  const messages = await getAllMessagesByChannelId(channel_id)

  if (messages && 'error' in messages) {
    return <p className="text-red-600 text-sm">failed to fetch messages</p>
  }
  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <ChatList
        thread_id={null}
        serverId={id}
        channel={channel}
        historyMessages={messages}
      />
    </div>
  );
}
