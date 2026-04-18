'use client'

import { useState } from "react"
import {
  Ban, Check, ChevronRight, Loader2, MoreHorizontal,
  Search, Shield, UserX, Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import useSWR from "swr"
import { getAllMembers, Member } from "@/lib/client/api/members"
import { getAllRoles, assignRole, unassignRole } from "@/lib/client/api/roles"
import { Role } from "@/lib/types/role"
import Image from "next/image"

// ─── Avatar ───────────────────────────────────────────────────────────────────

function MemberAvatar({ member }: { member: Member }) {
  if (member.avatar_url) {
    return (
      <div className="relative shrink-0">
        <Image
          src={member.avatar_url}
          width={36}
          height={36}
          alt={member.username}
          className="size-9 rounded-full object-cover"
        />
        <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#313338] bg-[#23a559]" />
      </div>
    )
  }

  const initials = member.username.slice(0, 2).toUpperCase()
  const hue = member.user_id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div className="relative shrink-0">
      <div
        className="size-9 rounded-full flex items-center justify-center text-xs font-bold text-white select-none"
        style={{ background: `hsl(${hue} 60% 40%)` }}
      >
        {initials}
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#313338] bg-[#23a559]" />
    </div>
  )
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border"
      style={{
        color: color || "#949ba4",
        borderColor: `${color || "#949ba4"}40`,
        background: `${color || "#949ba4"}15`,
      }}
    >
      <span className="size-1.5 rounded-full shrink-0" style={{ background: color || "#949ba4" }} />
      {name}
    </span>
  )
}

// ─── Member row ───────────────────────────────────────────────────────────────

type MemberRowProps = {
  member: Member
  allRoles: Role[]
  serverID: string
  onMutate: () => void
}

function MemberRow({ member, allRoles, serverID, onMutate }: MemberRowProps) {
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isOwner = member.role === "owner"

  const handleToggleRole = async (role: Role) => {
    if (isOwner || pendingRoleId) return
    setError(null)
    setPendingRoleId(role.id)
    try {
      if (member.role_id === role.id) {
        await unassignRole(member.user_id, serverID, role.id)
      } else {
        if (member.role_id) {
          await unassignRole(member.user_id, serverID, member.role_id)
        }
        await assignRole(member.user_id, serverID, role.id, "usr_001")
      }
      onMutate()
    } catch (err) {
      console.log(err)
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setPendingRoleId(null)
    }
  }

  const handleRemoveRole = async () => {
    if (!member.role_id || pendingRoleId) return
    setError(null)
    const roleId = member.role_id
    setPendingRoleId(roleId)
    try {
      await unassignRole(member.user_id, serverID, roleId)
      onMutate()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove role")
    } finally {
      setPendingRoleId(null)
    }
  }

  return (
    <div className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
      <MemberAvatar member={member} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#f2f3f5] truncate leading-tight">
          {member.username}
        </p>
        <p className="text-[11px] text-[#6d6f78] truncate">{member.user_id}</p>
      </div>

      {error && (
        <span className="text-[10px] text-[#f23f42] truncate max-w-24">{error}</span>
      )}
      {!error && member.role && member.role_color && (
        <RoleBadge name={member.role} color={member.role_color} />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1.5 rounded hover:bg-white/10 text-[#949ba4] hover:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal size={15} />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="left"
          align="start"
          className="w-52 bg-[#111214] border-white/10 text-white p-1.5"
        >
          {/* Roles section */}
          {!isOwner && allRoles.length > 0 && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-[#6d6f78] px-2 py-1.5">
                  <span className="flex items-center gap-1.5">
                    <Shield size={10} />
                    Roles
                  </span>
                </DropdownMenuLabel>

                {allRoles.map((role) => {
                  const isAssigned = member.role_id === role.id
                  const isPending = pendingRoleId === role.id
                  return (
                    <DropdownMenuItem
                      key={role.id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded cursor-pointer text-xs hover:bg-white/5 focus:bg-white/5"
                      onClick={() => handleToggleRole(role)}
                    >
                      <span
                        className="size-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                        style={{ background: role.color || "#6d6f78" }}
                      />
                      <span className="flex-1 truncate text-[#dbdee1]">{role.name}</span>
                      {isPending ? (
                        <Loader2 size={12} className="animate-spin text-[#949ba4] shrink-0" />
                      ) : isAssigned ? (
                        <Check size={12} className="text-[#23a559] shrink-0" />
                      ) : null}
                    </DropdownMenuItem>
                  )
                })}

                {member.role_id && (
                  <DropdownMenuItem
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded cursor-pointer text-xs text-[#f23f42] hover:bg-[#f23f42]/10 focus:bg-[#f23f42]/10"
                    onClick={handleRemoveRole}
                  >
                    <span className="size-2.5 rounded-full shrink-0 bg-[#f23f42]/40" />
                    <span className="flex-1">Remove role</span>
                    {pendingRoleId === member.role_id
                      ? <Loader2 size={11} className="animate-spin shrink-0" />
                      : <ChevronRight size={10} className="text-[#f23f42]/50 shrink-0" />
                    }
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="bg-white/10 my-1" />
            </>
          )}

          {isOwner && (
            <DropdownMenuItem disabled className="text-xs text-[#4e5058] px-2 py-1.5 cursor-default">
              Server owner — role locked
            </DropdownMenuItem>
          )}

          {!isOwner && (
            <>
              <DropdownMenuItem
                variant="destructive"
                className="gap-2 text-xs cursor-pointer px-2 py-1.5 rounded"
              >
                <UserX size={13} />
                Kick {member.username}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="gap-2 text-xs cursor-pointer px-2 py-1.5 rounded"
              >
                <Ban size={13} />
                Ban {member.username}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ─── Members panel ────────────────────────────────────────────────────────────

export default function Members({ serverID }: { serverID: string }) {
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")

  const { data: members, isLoading, mutate } = useSWR(
    `/api/members/${serverID}`,
    () => getAllMembers(serverID)
  )
  const { data: allRoles = [] } = useSWR(
    `/api/roles/${serverID}`,
    () => getAllRoles(serverID),
    { revalidateOnFocus: false }
  )

  const filtered = members?.filter((m) => {
    const matchesQuery = m.username.toLowerCase().includes(query.toLowerCase())
    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "none" ? !m.role_id : m.role_id === roleFilter)
    return matchesQuery && matchesRole
  })

  return (
    <phantom-ui loading={isLoading}>
      <div className="flex flex-col h-screen text-white overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-4 shrink-0 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-bold text-xl text-[#f2f3f5]">Members</h2>
              <p className="text-sm text-[#6d6f78] mt-0.5">
                {members?.length ?? 0} member{members?.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#6d6f78]">
              <Users size={13} />
              {filtered?.length ?? 0} shown
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-[#1e1f22] border border-white/10 rounded-lg px-3 py-2 focus-within:border-[#5865f2] transition-colors">
            <Search size={13} className="text-[#6d6f78] shrink-0" />
            <input
              type="text"
              placeholder="Search members…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-[#4e5058] outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-[#6d6f78] hover:text-[#f2f3f5] transition-colors text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Role filters */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setRoleFilter("all")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                roleFilter === "all"
                  ? "bg-white/15 text-white"
                  : "text-[#6d6f78] hover:text-white hover:bg-white/5"
              )}
            >
              All
            </button>
            {allRoles.map((role) => (
              <button
                key={role.id}
                onClick={() => setRoleFilter(roleFilter === role.id ? "all" : role.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  roleFilter === role.id
                    ? "bg-white/15 text-white"
                    : "text-[#6d6f78] hover:text-white hover:bg-white/5"
                )}
              >
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{ background: role.color || "#6d6f78" }}
                />
                {role.name}
              </button>
            ))}
            <button
              onClick={() => setRoleFilter(roleFilter === "none" ? "all" : "none")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                roleFilter === "none"
                  ? "bg-white/15 text-white"
                  : "text-[#6d6f78] hover:text-white hover:bg-white/5"
              )}
            >
              No role
            </button>
          </div>
        </div>

        <div className="h-px bg-white/[0.06] shrink-0" />

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {filtered?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#4e5058] gap-3">
              <Users size={32} />
              <p className="text-sm">No members match</p>
            </div>
          ) : (
            filtered?.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                allRoles={allRoles}
                serverID={serverID}
                onMutate={mutate}
              />
            ))
          )}
        </div>
      </div>
    </phantom-ui>
  )
}
