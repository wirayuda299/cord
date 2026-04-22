import { useState } from "react"
import { Role } from "@/lib/types/role"
import RoleList from "./list"
import RoleDetailView from "./role-detail-view"
import RoleFormView from "./role-form-view"


type View = "list" | "create" | "detail" | "edit"

export default function RolesSettings({ serverOwner }: { serverOwner: string }) {
  const [view, setView] = useState<View>("list")
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  const [memberCounts] = useState<Record<string, number>>({})

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
