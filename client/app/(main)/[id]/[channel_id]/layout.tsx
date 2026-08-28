import ChannelHeader from "@/components/server/ChannelHeader";
import { getChannelById } from "@/lib/queries/channel_detail";
import { type ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { hasPermission } from "@/lib/queries/permissions";
import { PermissionKey } from "@/constants/permissions";
import { isUserJoin } from "@/lib/queries/members";
import { redirect } from "next/navigation";
import ChannelActions from "@/components/server/ChannelActions";
import { getAllPinnedMessages } from "@/lib/queries/messages";

export default async function ChannelLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ channel_id: string; id: string }>;
}) {
  await auth.protect();
  const { channel_id, id } = await params;

  const isJoin = await isUserJoin(id);
  if (!isJoin) redirect("/direct-messages");

  const channel = await getChannelById(channel_id);

  if (channel && "error" in channel) return "Failed to fetch channel";

  const hasPerm = await hasPermission(
    channel.server_id,
    PermissionKey.ManageMessage,
  );
  const pinnedMessages = await getAllPinnedMessages(channel_id);

  const actions = (
    <ChannelActions
      pinnedMessages={pinnedMessages}
      serverId={id}
      channelId={channel_id}
      hasPerm={hasPerm}
    />
  )

  return (
    <div className="w-full bg-surface-content h-screen overflow-hidden flex flex-col">
      <ChannelHeader channel={channel} actions={actions} />
      {children}
    </div>
  );
}
