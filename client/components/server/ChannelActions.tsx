"use client";

import { useState } from "react";
import Notification from "@/components/server/Notification";
import PinnedMessages from "@/components/server/PinnedMessages";
import MembersButton from "@/components/server/MemberButton";
import SearchForm from "@/components/server/SearchForm";
import { PinnedMessage } from "@/types/chat";

export default function ChannelActions({
  serverId,
  channelId,
  hasPerm,
  pinnedMessages
}: {
  serverId: string;
  channelId: string;
  hasPerm: boolean;
  pinnedMessages:PinnedMessage[]
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {!isExpanded && (
        <>
          <Notification />
          <PinnedMessages
          pinnedMessages={pinnedMessages}
            canDelete={hasPerm}
            serverId={serverId}
          />
          <MembersButton />
        </>
      )}
      <SearchForm
        serverID={serverId}
        channelID={channelId}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
    </>
  );
}
