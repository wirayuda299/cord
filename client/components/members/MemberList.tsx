import { memo } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import useSWR from "swr";
import { getAllMembers, Member } from "@/lib/api/members";
import { X } from "lucide-react";
import { Avatar, getInitials, avatarColorFromSeed } from "@/components/ui/avatar";

const MemberRow = memo(
  ({
    member,
    isOnline,
    isOwner,
  }: {
    member: Member;
    isOnline?: boolean;
    isOwner: boolean;
  }) => {
    const isOffline = !isOnline;
    return (
      <div className="flex items-center flex-1 gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-white/5 transition-colors">

        <Avatar
          size={32}
          src={member.avatar_url}
          alt={`${member.username}'s avatar`}
          fallback={getInitials(member.username)}
          fallbackClassName={member.role_color ?? undefined}
          fallbackStyle={!member.role_color ? { background: avatarColorFromSeed(member.user_id) } : undefined}
          indicator={isOffline ? "offline" : "online"}
        />
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium truncate ${
              isOffline ? "text-zinc-500" : "text-zinc-200"
            }`}
          >
            {member.username}
            {member.role && !isOwner && (
              <span
                style={{
                  color: member.role_color ?? "#fff",
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
  },
);
MemberRow.displayName = "MemberRow";

type SectionLabelProps = {
  label: string;
  setIsMemberOpen:()=>void
};
const SectionLabel = memo(({ label,setIsMemberOpen }: SectionLabelProps) => {
  return (
    <p className="text-[11px] flex items-center justify-between font-medium text-zinc-500 uppercase tracking-widest px-2 pt-2 pb-1">
      {label}

      <button className="md:hidden" onClick={setIsMemberOpen}>
         <X size={15}/>
      </button>
    </p>
  );
});
SectionLabel.displayName = "SectionLabel";

type MemberListProps = {
  isOpen: boolean;
  serverId: string;
  serverOwner: string;
  onlineIds?: Set<string>;
  setIsMemberOpen: () => void
};

function MemberList({
  isOpen,
  serverId,
  onlineIds,
  serverOwner,
  setIsMemberOpen
}: MemberListProps) {
  const { data, error, isLoading } = useSWR(
    isOpen ? "/api/members" : null,
    () => getAllMembers(serverId),
  );

  const onlineCount = data
    ? data.filter((m) => onlineIds?.has(m.user_id)).length
    : 0;

  return (
    // Positioning/sizing wrapper — the only element that needs to care about
    // "mobile vs desktop":
    //  - below md: always `fixed`, fully outside ChatList's flex flow.
    //    Open/closed only ever toggles `translate-x`, sliding it on/off
    //    screen without ever touching the chat area's width.
    //  - md and up: `static`, i.e. a normal flex item again. `width`
    //    toggles between 0 and 15rem, which pushes the chat over to make
    //    room.
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-50 w-60 shrink-0",
        "md:static md:inset-auto md:z-auto md:translate-x-0 md:overflow-hidden",
        "transition-all duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full md:w-0",
      )}
    >
      {/* Constant-width inner content so nothing reflows during the
          transition — the wrapper above just clips/reveals it. */}
      <ScrollArea className="h-full w-60 overflow-y-auto bg-zinc-800 px-2 pt-2 pb-20 font-sans">
        {error ? (
          <p className="p-2 text-sm text-red-500">Failed to load members</p>
        ) : isLoading ? (
          <p className="p-2 text-sm text-zinc-500">Loading…</p>
        ) : (
          <>
            <SectionLabel setIsMemberOpen={setIsMemberOpen} label={`Online — ${onlineCount}`} />
            {data?.map((member) => (
              <MemberRow
                key={member.id}
                isOwner={member.user_id === serverOwner}
                member={member}
                isOnline={!!onlineIds?.has(member.user_id)}
              />
            ))}
          </>
        )}
      </ScrollArea>
    </div>
  );
}

export default memo(MemberList);
