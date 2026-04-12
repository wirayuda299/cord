import DropdownWrapper from "@/components/shared/DropdownWrapper";
import { getAllPinnedMessages } from "@/lib/server/data/messages";
import { Pin } from "lucide-react";
import PinnedMessageItem from "./PinnedMessageItem";

export default async function PinnedMessages({
  channelId,
}: {
  channelId: string;
}) {
  const pinnedMessages = await getAllPinnedMessages(channelId);
  return (
    <DropdownWrapper
      style="min-w-80 bg-sidebar-primary text-gray-400 p-0 max-h-[300px]"
      icon={<Pin className="text-muted-foreground text-sm hover:text-white" />}
    >
      <PinnedMessageItem pinnedMessages={pinnedMessages || []} />
    </DropdownWrapper>
  );
}
