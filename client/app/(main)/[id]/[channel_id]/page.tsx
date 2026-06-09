import ChatList from "@/components/chat/ChatList";
import VideoCall from "@/components/VideoCall";
import { getChannelById } from "@/lib/server/data/channel_detail";
import { getAllMessagesByChannelId } from "@/lib/server/data/messages";
import { auth } from "@clerk/nextjs/server";
import { unauthorized } from "next/navigation";

export default async function ChannelDetail({
  params,
}: {
  params: Promise<{ channel_id: string; id: string }>;
}) {

  const { userId } = await auth()

  if (!userId) return unauthorized()

  const { channel_id, id } = await params

  const channel = await getChannelById(channel_id)
  if (channel && 'error' in channel) {
    return <p className="text-red-600 text-sm">failed to fetch channel</p>
  }

  if (channel.channel_type === 'audio') {
    return <VideoCall room={channel.id} serverId={id} />
  } else {
    const messages = await getAllMessagesByChannelId(channel_id)
    if (messages && 'error' in messages) {
      return <p className="text-red-600 text-sm">failed to fetch messages</p>
    }

    return (
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatList
          serverOwner={channel.created_by}
          currentUser={userId}
          thread_id={null}
          serverId={id}
          channel={channel}
          historyMessages={messages}
        />
      </div>
    );
  }

}
