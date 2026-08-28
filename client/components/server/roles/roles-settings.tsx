import { useMemo, useState } from "react"
import useSWR from "swr"
import { Role } from "@/lib/types/role"
import RoleList from "./list"
import RoleDetailView from "./role-detail-view"
import RoleFormView from "./role-form-view"
import { getAllMembers } from "@/lib/client/api/members"


type View = "list" | "create" | "detail" | "edit"

export default function RolesSettings({ serverOwner, serverID }: { serverOwner: string, serverID: string }) {
  const [view, setView] = useState<View>("list")
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  const { data: members } = useSWR(
    serverID ? ["/api/members", serverID] : null,
    () => getAllMembers(serverID)
  )
  const memberCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const member of members ?? []) {
      if (!member.role_id) continue
      counts[member.role_id] = (counts[member.role_id] ?? 0) + 1
    }
    return counts
  }, [members])

  if (view === "create") {
    return <RoleFormView mode="create" onBack={() => setView("list")} />
  }

  if (view === "edit" && selectedRole) {
    return (
      <RoleFormView
        mode="edit"
        role={selectedRole}
        initialPermissions={editPermissions}
        onBack={() => setView("detail")}
      />
    )
  }

  if (view === "detail" && selectedRole) {
    return (
      <div className="w-full">
        <RoleDetailView
          serverID={serverID}
          serverOwner={serverOwner}
          role={selectedRole}
          onBack={() => {
            setView("list")
            setSelectedRole(null)
          }}
          onEdit={(permissions) => {
            setEditPermissions(permissions)
            setView("edit")
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex w-full text-white gap-3 bg-surface-chat">
      <aside className="min-h-screen">
        <RoleList
          selectedId={selectedRole?.id ?? null}
          onSelect={(_, role) => {
            setSelectedRole(role)
            setView("detail")
          }}
          memberCounts={memberCounts}
          onCreateClick={() => setView("create")}
        />
      </aside>
    </div>
  )
}
