import { memo } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
   MEMBERS,
   Member,
   STATUS_DOT,
   ROLE_BADGE,
   getOnlineMembers,
   getOfflineMembers,
} from "@/constants/members";

type AvatarProps = {
   member: Member;
};

const Avatar = memo(({ member }: AvatarProps) => {
   return (
      <div className="relative shrink-0">
         <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${member.color}`}
         >
            {member.initials}
         </div>
         <div
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-800 ${STATUS_DOT[member.status]}`}
         />
      </div>
   );
});

Avatar.displayName = "Avatar";

type MemberRowProps = {
   member: Member;
};

const MemberRow = memo(({ member }: MemberRowProps) => {
   const isOffline = member.status === "offline";

   return (
      <div className="flex items-center flex-1 gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-white/5 transition-colors">
         <Avatar member={member} />
         <div className="flex-1 min-w-0">
            <p
               className={`text-sm font-medium truncate ${
                  isOffline ? "text-zinc-500" : "text-zinc-200"
               }`}
            >
               {member.name}
            </p>
            {member.activity && (
               <p className="text-xs text-zinc-500 truncate">
                  {member.activity}
               </p>
            )}
         </div>
         {member.role && (
            <span
               className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${ROLE_BADGE[member.role]}`}
            >
               {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
            </span>
         )}
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

const online = getOnlineMembers(MEMBERS);
const offline = getOfflineMembers(MEMBERS);

type MemberListProps = {
   isOpen: boolean;
};

export default function MemberList({ isOpen }: MemberListProps) {
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
         <SectionLabel label={`Online — ${online.length}`} />
         {online.map((member) => (
            <MemberRow key={member.id} member={member} />
         ))}
         <hr className="border-zinc-700 my-1.5 mx-2" />
         <SectionLabel label={`Offline — ${offline.length}`} />
         {offline.map((member) => (
            <MemberRow key={member.id} member={member} />
         ))}
      </ScrollArea>
   );
}
