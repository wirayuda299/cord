"use client";

import { useState } from "react";
import Notification from "@/components/Notification";
import PinnedMessages from "@/components/PinnedMessages";
import MembersButton from "@/components/MemberButton";
import SearchForm from "@/components/SearchForm";
import { PinnedMessage } from "@/lib/types/chat";

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
