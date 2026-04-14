'use client'

import { useState, useMemo } from "react"
import { MoreHorizontal, Search, ShieldAlert, Crown, Bot, Users, UserX, Ban, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MEMBERS,
  Member,
  MemberRole,
  STATUS_DOT,
  ROLE_BADGE,
} from "@/constants/members"

const STATUS_LABEL: Record<string, string> = {
  online: "Online",
  idle:   "Idle",
  dnd:    "Do Not Disturb",
  offline: "Offline",
}

const ROLE_FILTERS: { label: string; value: MemberRole | "all" }[] = [
  { label: "All",     value: "all" },
  { label: "Owner",   value: "owner" },
  { label: "Mod",     value: "mod" },
  { label: "Bot",     value: "bot" },
  { label: "Members", value: null },
]

const ROLE_ICON: Record<NonNullable<MemberRole>, React.ReactNode> = {
  owner: <Crown size={11} />,
  mod:   <ShieldCheck size={11} />,
  bot:   <Bot size={11} />,
}

function MemberAvatar({ member }: { member: Member }) {
  return (
    <div className="relative shrink-0">
      <div className={cn("size-9 rounded-full flex items-center justify-center text-xs font-semibold select-none", member.color)}>
        {member.initials}
      </div>
      <span className={cn("absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-sidebar-primary", STATUS_DOT[member.status])} />
    </div>
  )
}

function RoleBadge({ role }: { role: NonNullable<MemberRole> }) {
  return (
    <span className={cn("flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0", ROLE_BADGE[role])}>
      {ROLE_ICON[role]}
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  )
}

function MemberRow({ member }: { member: Member }) {
  const isOffline = member.status === "offline"

  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
      <MemberAvatar member={member} />

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate leading-tight", isOffline ? "text-white/35" : "text-white")}>
          {member.name}
        </p>
        <p className="text-xs text-white/30 truncate leading-tight mt-0.5">
          {member.activity ?? STATUS_LABEL[member.status]}
        </p>
      </div>

      {member.role && <RoleBadge role={member.role} />}

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
                Kick {member.name}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" className="gap-2 text-xs cursor-pointer">
                <Ban size={13} />
                Ban {member.name}
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

export default function Members() {
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<MemberRole | "all">("all")

  const filtered = useMemo(() => {
    return MEMBERS.filter((m) => {
      const matchesQuery = m.name.toLowerCase().includes(query.toLowerCase())
      const matchesRole = roleFilter === "all" ? true : m.role === roleFilter
      return matchesQuery && matchesRole
    })
  }, [query, roleFilter])

  const onlineCount = MEMBERS.filter((m) => m.status !== "offline").length

  return (
    <div className="flex flex-col w-full max-h-screen overflow-hidden text-white">

      {/* Header */}
      <div className="px-8 pt-8 pb-4 shrink-0">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-semibold text-xl">Members</h2>
            <p className="text-sm text-white/40 mt-0.5">
              {onlineCount} online · {MEMBERS.length} total
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Users size={13} />
            {filtered.length} shown
          </div>
        </div>

        {/* Search */}
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

        {/* Role filter tabs */}
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

      {/* Member list */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/25 gap-2">
            <Users size={32} className="opacity-50" />
            <p className="text-sm">No members found</p>
          </div>
        ) : (
          <>
            {/* Online group */}
            {(() => {
              const online = filtered.filter((m) => m.status !== "offline")
              const offline = filtered.filter((m) => m.status === "offline")
              return (
                <>
                  {online.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 px-4 pt-3 pb-1.5">
                        Online — {online.length}
                      </p>
                      {online.map((m) => <MemberRow key={m.id} member={m} />)}
                    </div>
                  )}
                  {offline.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 px-4 pt-4 pb-1.5">
                        Offline — {offline.length}
                      </p>
                      {offline.map((m) => <MemberRow key={m.id} member={m} />)}
                    </div>
                  )}
                </>
              )
            })()}
          </>
        )}
      </div>

    </div>
  )
}
