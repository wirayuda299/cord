import DropdownWrapper from "@/components/shared/DropdownWrapper";
import { Pin } from "lucide-react";
import PinnedMessageItem from "./PinnedMessageItem";
import { PinnedMessage } from "@/types/chat";

export default function PinnedMessages({
  canDelete,
  serverId,
  pinnedMessages
}: {
  canDelete: boolean
  serverId: string
    pinnedMessages:PinnedMessage[]
}) {
  return (
    <DropdownWrapper
      style="min-w-80 bg-sidebar-primary text-gray-400 p-0 max-h-[300px]"
      icon={<Pin size={18} className="text-muted-foreground hover:text-white" />}
    >
      <PinnedMessageItem pinnedMessages={pinnedMessages || []} canDelete={canDelete} serverId={serverId} />
    </DropdownWrapper>
  );
}
