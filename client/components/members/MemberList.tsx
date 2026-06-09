
import { memo } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import useSWR from "swr";
import { getAllMembers, Member } from "@/lib/client/api/members";
import Image from "next/image";

const Avatar = memo(({ member, isOnline }: { member: Member; isOnline?: boolean }) => {
  const indicator = isOnline ? "bg-emerald-400" : "bg-zinc-700";
  return (
    <div className="relative shrink-0">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${member.role_color}`}
      >
        <Image
          src={member.avatar_url}
          alt={`${member.username}'s avatar`}
          className="w-full h-full rounded-full object-cover"
          width={32}
          height={32}
        />
      </div>
      <div
        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-800 ${indicator}`}
      />
    </div>
  );
});

Avatar.displayName = "Avatar";


const MemberRow = memo(({ member, isOnline, isOwner }: { member: Member; isOnline?: boolean, isOwner: boolean }) => {
  const isOffline = !isOnline;

  return (
    <div className="flex items-center flex-1 gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-white/5 transition-colors">
      <Avatar member={member} isOnline={!isOffline} />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${isOffline ? "text-zinc-500" : "text-zinc-200"
            }`}
        >
          {member.username}
          {member.role && !isOwner && (
            <span
              style={{
                color: member.role_color ?? "#fff"
              }}
              className={`text-[10px] lowercase font-medium rounded-full shrink-0 block`}
            >
              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
            </span>
          )}
        </p>

      </div>

    </div>
  );
});

MemberRow.displayName = "MemberRow";

type SectionLabelProps = {
  label: string;
};

const SectionLabel = memo(({ label }: SectionLabelProps) => {
  return (
    <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest px-2 pt-2 pb-1">
      {label}
    </p>
  );
});

SectionLabel.displayName = "SectionLabel";


type MemberListProps = {
  isOpen: boolean;
  serverId: string;
  serverOwner: string
  onlineIds?: Set<string>;
};

function MemberList({ isOpen, serverId, onlineIds, serverOwner }: MemberListProps) {
  const { data, error, isLoading } = useSWR(isOpen ? "/api/members" : null, () => getAllMembers(serverId));

  if (error) {
    return <div className="p-4 text-red-500">Failed to load members</div>;
  }

  const onlineCount = data ? data.filter((m) => onlineIds?.has(m.user_id)).length : 0;

  if (isLoading) return <p>loading...</p>

  return (
    <ScrollArea
      className={cn(
        "h-screen overflow-y-auto bg-zinc-800 px-2 pt-2 pb-20 font-sans",
        "transition-all duration-300 ease-in-out",
        isOpen
          ? "w-60 translate-x-0"
          : "w-0 translate-x-full overflow-hidden p-0",
      )}
    >
      <SectionLabel label={`Online — ${onlineCount}`} />
      {data?.map((member) => (
        <MemberRow
          key={member.id}
          isOwner={member.user_id === serverOwner}
          member={member}
          isOnline={!!onlineIds?.has(member.user_id)}
        />
      ))}

    </ScrollArea>

  );
}

export default memo(MemberList)
