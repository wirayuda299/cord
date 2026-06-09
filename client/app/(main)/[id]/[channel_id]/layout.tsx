import ChannelHeader from "@/components/server/ChannelHeader";
import { getChannelById } from "@/lib/server/data/channel_detail";
import Notification from "@/components/Notification";
import PinnedMessages from "@/components/PinnedMessages";
import MembersButton from "@/components/MemberButton";
import SearchForm from "@/components/SearchForm";
import { Suspense, type ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { hasPermission } from "@/lib/client/api/permissions";
import { PermissionKey } from "@/constants/permissions";

export default async function ChannelLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ channel_id: string; id: string }>;
}) {
  const { channel_id, id } = await params;
  const { userId, getToken } = await auth()
  const token = await getToken()

  const channel = await getChannelById(channel_id);

  if (channel && "error" in channel) {
    return "Failed to fetch channel";
  }

  const hasPerm = await hasPermission(channel.server_id, PermissionKey.ManageMessage, token)

  const canDelete = channel.created_by === userId || hasPerm
  const actions = (
    <>
      <Notification />
      <PinnedMessages channelId={channel_id} canDelete={canDelete} serverId={id} />
      <MembersButton />
      <SearchForm />
    </>
  );

  return (
    <div className="w-full bg-surface-content h-screen overflow-hidden flex flex-col">
      <Suspense fallback={<p>loading channel header...</p>}>
        <ChannelHeader channel={channel} actions={actions} />
      </Suspense>
      {children}
    </div>
  );
}
