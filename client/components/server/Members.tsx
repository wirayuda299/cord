'use client'

import { useState } from "react"
import { MoreHorizontal, Search, ShieldAlert, Users, UserX, Ban } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MemberRole,
} from "@/constants/members"
import useSWR from "swr"
import { getAllMembers, Member } from "@/lib/client/api/members"


const ROLE_FILTERS: { label: string; value: MemberRole | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Owner", value: "owner" },
  { label: "Mod", value: "mod" },
  { label: "Bot", value: "bot" },
  { label: "Members", value: null },
]

function MemberAvatar({ member }: { member: Member }) {
  return (
    <div className="relative shrink-0">
      <div className={cn("size-9 rounded-full flex items-center justify-center text-xs font-semibold select-none", member.role_color)}>
        {member.username.at(0)}
      </div>
      <span className={cn("absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-sidebar-primary")} />
    </div>
  )
}

function MemberRow({ member }: { member: Member }) {

  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
      <MemberAvatar member={member} />

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate leading-tight", true ? "text-white/35" : "text-white")}>
          {member.username}
        </p>
      </div>

      {member.role && (
        <span
          style={{
            ...(member.role_color && {
              color: member.role_color
            })
          }}
          className={cn("flex capitalize items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0")}
        >
          {member.role}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-1 rounded hover:bg-white/10 text-white/50 hover:text-white">
          <MoreHorizontal size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="left"
          className="w-44 bg-sidebar-primary border-white/10 text-white"
        >
          {member.role !== "owner" && (
            <>
              <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
                <ShieldAlert size={13} className="text-indigo-400" />
                {member.role === "mod" ? "Remove Mod" : "Make Moderator"}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem variant="destructive" className="gap-2 text-xs cursor-pointer">
                <UserX size={13} />
                Kick {member.username}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" className="gap-2 text-xs cursor-pointer">
                <Ban size={13} />
                Ban {member.username}
              </DropdownMenuItem>
            </>
          )}
          {member.role === "owner" && (
            <DropdownMenuItem disabled className="text-xs text-white/30">
              Server owner
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default function Members({ serverID }: { serverID: string }) {
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<MemberRole | "all">("all")
  const { data: members, isLoading } = useSWR("/api/members", () => getAllMembers(serverID))

  console.log(members)

  return (
    <phantom-ui loading={isLoading}>
      <div className="flex flex-col w-full max-h-screen overflow-hidden text-white">
        <div className="px-8 pt-8 pb-4 shrink-0">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="font-semibold text-xl">Members</h2>
              <p className="text-sm text-white/40 mt-0.5">
                0 online · {members?.length} total
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/30">
              <Users size={13} />
              {members?.length} shown
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-4 focus-within:border-white/20 transition-colors">
            <Search size={14} className="text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Search members..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-white/30 hover:text-white/60 transition-colors text-xs">
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {ROLE_FILTERS.map((f) => (
              <button
                key={String(f.value)}
                onClick={() => setRoleFilter(f.value)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  roleFilter === f.value
                    ? "bg-white/15 text-white"
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-white/5 shrink-0" />

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {members?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/25 gap-2">
              <Users size={32} className="opacity-50" />
              <p className="text-sm">No members found</p>
            </div>
          ) : (
            <>
              {members?.map(m => <MemberRow key={m.id} member={m} />)}
            </>
          )}
        </div>
      </div>
    </phantom-ui>
  )
}
