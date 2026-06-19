import ChannelHeader from "@/components/server/ChannelHeader";
import { getChannelById } from "@/lib/server/data/channel_detail";
import Notification from "@/components/Notification";
import PinnedMessages from "@/components/PinnedMessages";
import MembersButton from "@/components/MemberButton";
import SearchForm from "@/components/SearchForm";
import { type ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { hasPermission } from "@/lib/client/api/permissions";
import { PermissionKey } from "@/constants/permissions";
import { isUserJoin } from "@/lib/server/data/members";
import { redirect } from "next/navigation";

export default async function ChannelLayout({
   children,
   params,
}: {
   children: ReactNode;
   params: Promise<{ channel_id: string; id: string }>;
}) {
   const { channel_id, id } = await params;

   const isJoin = await isUserJoin(id);
   if (!isJoin) redirect("/direct-messages");

   const { userId, getToken } = await auth();
   const token = await getToken();

   const channel = await getChannelById(channel_id);

   if (channel && "error" in channel) return "Failed to fetch channel";

   const hasPerm = await hasPermission(
      channel.server_id,
      PermissionKey.ManageMessage,
      token,
   );

   const canDelete = channel.created_by === userId || hasPerm;
   const actions = (
      <>
         <Notification />
         <PinnedMessages
            channelId={channel_id}
            canDelete={canDelete}
            serverId={id}
         />
         <MembersButton />
         <SearchForm serverID={id} channelID={channel_id} />
      </>
   );

   return (
      <div className="w-full bg-surface-content h-screen overflow-hidden flex flex-col">
         <ChannelHeader channel={channel} actions={actions} />
         {children}
      </div>
   );
}
