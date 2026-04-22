import useToggleRoleMember from "@/hooks/useToggleRole"
import { getAllMemberByRole, UserRole } from "@/lib/client/api/roles"
import { Role } from "@/lib/types/role"
import { Loader2, Users, X } from "lucide-react"
import { server } from "shadcn/mcp"
import useSWR from "swr"

function MemberRow({
  user,
  roleId,
  serverID,
  onMutate,
  serverOwner
}: {
  user: UserRole
  roleId: string
  serverID: string
  onMutate: () => void,
  serverOwner: string
}) {
  const { handleToggleRole, pendingRoleId, error } = useToggleRoleMember({
    serverID,
    member: { user_id: user.user_id, role_id: roleId },
    onMutate,
    serverOwner
  })

  const initials = (user.username ?? user.user_id)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <div className="flex relative items-center gap-3 px-4 py-2.5 rounded-xl bg-white/3 border border-white/5">
      {user.avatar_url ? (
        <img src={user.avatar_url} alt="" className="size-9 rounded-full object-cover shrink-0" />
      ) : (
        <div className="size-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white/60 shrink-0">
          {initials || "?"}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{user.username ?? user.user_id}</p>
        <p className="text-xs text-white/30 truncate font-mono">{user.user_id}</p>
        {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
      </div>
      <button
        className="absolute right-3 disabled:opacity-40"
        disabled={!!pendingRoleId}
        onClick={(e) => {
          e.stopPropagation()
          handleToggleRole(roleId)
        }}
      >
        {pendingRoleId ? (
          <Loader2 size={15} className="text-white/40 animate-spin" />
        ) : (
          <X size={15} className="text-red-600" />
        )}
      </button>
    </div>
  )
}

export default function MembersTab({ role, serverID, serverOwner }: { serverOwner: string, role: Role; serverID: string }) {
  const { data: userRows, isLoading, mutate } = useSWR(
    `/api/role-member/${role.id}`,
    () => getAllMemberByRole(role.id)
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="text-white/25 animate-spin" />
      </div>
    )
  }

  if (!userRows || userRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/25 gap-2">
        <Users size={32} className="opacity-40" />
        <p className="text-sm">No members have this role</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-white/30 mb-3">
        {userRows.length} member{userRows.length !== 1 ? "s" : ""}
      </p>
      {userRows.map((u) => (
        <MemberRow
          key={u.user_id}
          user={u}
          roleId={role.id}
          serverID={serverID}
          onMutate={mutate}
          serverOwner={serverOwner}
        />
      ))}
    </div>
  )
}
