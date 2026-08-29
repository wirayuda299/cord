"use client";

import { useState } from "react";
import {
  Ban,
  Check,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Search,
  Shield,
  UserX,
  Users,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useSWR, { mutate as globalMutate } from "swr";
import { kickMember, banMember, unbanMember } from "@/lib/actions/servers";
import { getAllRoles, unassignRole } from "@/lib/api/roles";
import { Role } from "@/types/role";
import useToggleRoleMember from "@/hooks/useToggleRole";
import { format } from "date-fns";
import { hasPermission } from "@/lib/api/permissions";
import { PermissionKey } from "@/constants/permissions";
import { Avatar, getInitials, avatarColorFromSeed } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAppStore } from "@/stores/store";
import { Member } from "@/types/server";
import { apiFetcher } from "@/lib/fetcher";
import { toast } from "@/components/ui/toast";

function MemberAvatar({ member }: { member: Member }) {
  const isOnline = useAppStore((s) => s.onlineUserIds.has(member.user_id));
  return (
    <Avatar
      src={member.avatar_url}
      alt={member.username}
      fallback={getInitials(member.username)}
      fallbackStyle={{ background: avatarColorFromSeed(member.user_id) }}
      indicator={isOnline ? "online" : "offline"}
    />
  );
}

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
      <span
        className="size-1.5 rounded-full shrink-0"
        style={{ background: color || "#949ba4" }}
      />
      {name}
    </span>
  );
}

function KickConfirmDialog({
  username,
  onConfirm,
  onCancel,
}: {
  username: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmDialog
      icon={<UserX size={20} />}
      tone="danger"
      title={`Kick ${username}`}
      subtitle="Are you sure you want to kick this member?"
      description={
        <>
          Kicking{" "}
          <span className="text-white font-medium">{username}</span> will
          remove them from the server. They can rejoin with a new invite.
        </>
      }
      confirmLabel="Kick"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

function BanConfirmDialog({
  username,
  onConfirm,
  onCancel,
}: {
  username: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <ConfirmDialog
      icon={<Ban size={20} />}
      tone="danger"
      title={`Ban ${username}`}
      subtitle="Are you sure you want to ban this member?"
      description={
        <>
          Banning{" "}
          <span className="text-white font-medium">{username}</span> will
          remove them from the server and prevent them from rejoining.
        </>
      }
      confirmLabel="Ban"
      onConfirm={() => onConfirm(reason)}
      onCancel={onCancel}
    >
      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#949ba4]">
          Reason for ban
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Optional reason for ban"
          rows={2}
          maxLength={150}
          className="w-full bg-[#1e1f22] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder:text-[#4e5058] outline-none focus:border-[#5865f2] transition-colors resize-none"
        />
      </div>
    </ConfirmDialog>
  );
}

type MemberRowProps = {
  member: Member;
  allRoles: Role[];
  serverID: string;
  onMutate: () => void;
  serverOwner: string;
  hasKickMemberPerm: boolean;
  hasBanMemberPerm: boolean;
};

function MemberRow({
  member,
  allRoles,
  serverID,
  onMutate,
  serverOwner,
  hasKickMemberPerm,
  hasBanMemberPerm,
}: MemberRowProps) {
  const isOwner = member.user_id === serverOwner;

  const { error, pendingRoleId, handleToggleRole, setError } =
    useToggleRoleMember({
      member: {
        user_id: member.user_id,
        role_id: member.role_id,
      },
      serverID,
      onMutate,
      serverOwner,
    });

  const handleRemoveRole = async () => {
    if (!member.role_id || pendingRoleId) return;
    setError(null);
    const roleId = member.role_id;
    try {
      await unassignRole(member.user_id, serverID, roleId);
      onMutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove role");
    }
  };

  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showKickDialog, setShowKickDialog] = useState(false);

  const handleKickMember = async () => {
    try {
      const res = await kickMember(member.user_id, serverID);
      if (!res.success) {
        throw new Error(res.message);
      }
      setShowKickDialog(false);
      onMutate();
      globalMutate("/api/members");
    } catch (e) {
      toast.add({ title: e instanceof Error ? e.message : String(e), type: "error" });
    }
  };

  const handleBanMember = async (reason: string) => {
    try {
      const res = await banMember(serverID, member.user_id, reason);
      if (res.error) {
        throw new Error(res.error);
      }
      setShowBanDialog(false);
      onMutate();
      globalMutate("/api/members");
    } catch (e) {
      toast.add({ title: e instanceof Error ? e.message : String(e), type: "error" });
    }
  };

  const handleUnbanMember = async () => {
    try {
      const res = await unbanMember(serverID, member.user_id);
      if (!res.success) {
        throw new Error(res.message);
      }
      onMutate();
    } catch (e) {
      toast.add({ title: e instanceof Error ? e.message : String(e), type: "error" });
    }
  };

  return (
    <div className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
      <MemberAvatar member={member} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#f2f3f5] hover:text-white truncate leading-tight flex items-center gap-2">
          {member.username}
          {member.is_banned && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-red-400 uppercase tracking-wide shrink-0">
              Banned
            </span>
          )}
        </p>
        <p className="text-[11px] text-[#6d6f78] truncate">
          {" "}
          joined at {format(member.joined_at, "MMM d, yyyy")}
        </p>
      </div>

      {error && (
        <span className="text-[10px] text-[#f23f42] truncate max-w-24">
          {error}
        </span>
      )}
      {!error && member.role && member.role_color && (
        <RoleBadge name={member.role} color={member.role_color} />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 p-1.5 rounded hover:bg-white/10 text-[#949ba4] hover:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal size={15} />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="left"
          align="start"
          className="w-52 bg-[#111214] border-white/10 text-white p-1.5"
        >
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
                  const isAssigned = member.role_id === role.id;
                  const isPending = pendingRoleId === role.id;
                  return (
                    <DropdownMenuItem
                      key={role.id}
                      className="flex items-center group gap-2.5 px-2 py-1.5 rounded cursor-pointer text-xs hover:bg-white/5 focus:bg-white/5  focus:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRole(role.id);
                      }}
                    >
                      <span
                        className="size-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                        style={{
                          background: role.color || "#6d6f78",
                        }}
                      />
                      <span className="flex-1 truncate text-[#dbdee1] group-hover:text-white">
                        {role.name}
                      </span>
                      {isPending ? (
                        <Loader2
                          size={12}
                          className="animate-spin text-[#949ba4] shrink-0"
                        />
                      ) : isAssigned ? (
                        <Check
                          size={12}
                          className="text-[#23a559] shrink-0"
                        />
                      ) : null}
                    </DropdownMenuItem>
                  );
                })}

                {member.role_id && (
                  <DropdownMenuItem
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded cursor-pointer text-xs text-[#f23f42] hover:bg-[#f23f42]/10 focus:bg-[#f23f42]/10"
                    onClick={handleRemoveRole}
                  >
                    <span className="size-2.5 rounded-full shrink-0 bg-[#f23f42]/40" />
                    <span className="flex-1">Remove role</span>
                    {pendingRoleId === member.role_id ? (
                      <Loader2
                        size={11}
                        className="animate-spin shrink-0"
                      />
                    ) : (
                      <ChevronRight
                        size={10}
                        className="text-[#f23f42]/50 shrink-0"
                      />
                    )}
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="bg-white/10 my-1" />
            </>
          )}

          {isOwner && (
            <DropdownMenuItem
              disabled
              className="text-xs text-[#4e5058] px-2 py-1.5 cursor-default"
            >
              Server owner — role locked
            </DropdownMenuItem>
          )}

          {!isOwner && (
            <>
              {hasKickMemberPerm && (
                <DropdownMenuItem
                  onClick={() => setShowKickDialog(true)}
                  variant="destructive"
                  className="gap-2 text-xs cursor-pointer px-2 py-1.5 rounded"
                >
                  <UserX size={13} />
                  Kick {member.username}
                </DropdownMenuItem>
              )}
              {hasBanMemberPerm &&
                (member.is_banned ? (
                  <DropdownMenuItem
                    onClick={handleUnbanMember}
                    className="gap-2 text-xs cursor-pointer px-2 py-1.5 rounded text-green-400 hover:bg-green-500/10 focus:bg-green-500/10 focus:text-green-400"
                  >
                    <RotateCcw size={13} />
                    Unban {member.username}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => setShowBanDialog(true)}
                    variant="destructive"
                    className="gap-2 text-xs cursor-pointer px-2 py-1.5 rounded"
                  >
                    <Ban size={13} />
                    Ban {member.username}
                  </DropdownMenuItem>
                ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {showKickDialog && (
        <KickConfirmDialog
          username={member.username}
          onConfirm={handleKickMember}
          onCancel={() => setShowKickDialog(false)}
        />
      )}
      {showBanDialog && (
        <BanConfirmDialog
          username={member.username}
          onConfirm={handleBanMember}
          onCancel={() => setShowBanDialog(false)}
        />
      )}
    </div>
  );
}

export default function Members({
  serverID,
  serverOwner,
}: {
  serverOwner: string;
  serverID: string;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const {
    data: hasKickMemberPerm,
    error: kickMemberError,
    isLoading: kickMemberLoading,
  } = useSWR(
    `/api/permissions/${serverID}`,
    () => hasPermission(serverID, PermissionKey.KickMember),
    { suspense: true },
  );

  const {
    data: hasBanMemberPerm,
    error: banMemberError,
    isLoading: banMemberLoading,
  } = useSWR(
    `/api/permissions/${serverID}`,
    () => hasPermission(serverID, PermissionKey.BanMember),
    { suspense: true },
  );

  const {
    data: members,
    isLoading,
    mutate,
  } = useSWR(`/api/members/${serverID}`,  () => apiFetcher<Member[]>(`members/find-all?serverID=${serverID}`));

  const { data: allRoles = [] } = useSWR(
    `/api/roles/${serverID}`,
    () => getAllRoles(serverID),
    { revalidateOnFocus: false },
  );

  const filtered = members?.filter((m) => {
    const matchesQuery = m.username
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "none" ? !m.role_id : m.role_id === roleFilter);
    return matchesQuery && matchesRole;
  });

  if (kickMemberError)
    return <p className="text-sm text-red-500">Failed to load permissions</p>;
  if (banMemberError)
    return <p className="text-sm text-red-500">Failed to load permissions</p>;

  return (
    <phantom-ui loading={isLoading || kickMemberLoading || banMemberLoading}>
      <div className="flex flex-col h-screen text-white overflow-hidden">
        <div className="p-3 lg:px-8 lg:pt-8 lg:pb-4 shrink-0 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-sm font-bold md:text-xl text-[#f2f3f5]">
                Members
              </h2>
              <p className="text-xs md:text-sm text-[#6d6f78] mt-0.5">
                {members?.length ?? 0} member
                {members?.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#6d6f78]">
              <Users size={13} />
              {filtered?.length ?? 0} shown
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#1e1f22] border border-white/10 rounded-lg px-3 py-2 transition-colors">
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

          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setRoleFilter("all")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                roleFilter === "all"
                  ? "bg-white/15 text-white"
                  : "text-[#6d6f78] hover:text-white hover:bg-white/5",
              )}
            >
              All
            </button>
            {allRoles.map((role) => (
              <button
                key={role.id}
                onClick={() =>
                  setRoleFilter(
                    roleFilter === role.id ? "all" : role.id,
                  )
                }
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  roleFilter === role.id
                    ? "bg-white/15 text-white"
                    : "text-[#6d6f78] hover:text-white hover:bg-white/5",
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
              onClick={() =>
                setRoleFilter(roleFilter === "none" ? "all" : "none")
              }
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                roleFilter === "none"
                  ? "bg-white/15 text-white"
                  : "text-[#6d6f78] hover:text-white hover:bg-white/5",
              )}
            >
              No role
            </button>
          </div>
        </div>

        <div className="h-px bg-white/6 shrink-0" />

        <div className="flex-1 overflow-y-auto py-2">
          {filtered?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#4e5058] gap-3">
              <Users size={32} />
              <p className="text-sm">No members match</p>
            </div>
          ) : (
            filtered?.map((m) => (
              <MemberRow
                hasBanMemberPerm={hasBanMemberPerm}
                hasKickMemberPerm={hasKickMemberPerm}
                serverOwner={serverOwner}
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
  );
}
