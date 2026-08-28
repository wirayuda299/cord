"use client"

import { useState } from "react"
import { Role } from "@/lib/types/role"
import RoleList from "./list"
import RoleDetailView from "./role-detail-view"
import RoleFormView from "./role-form-view"

type View = "list" | "create" | "detail" | "edit"

export default function RolesSettings({
  serverOwner,
  serverID,
}: {
  serverOwner: string
  serverID: string
}) {
  const [view, setView] = useState<View>("list")
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [editPermissions, setEditPermissions] = useState<string[]>([])

  // Placeholder until member counts are wired to a real endpoint (e.g. a
  // /api/roles/member-counts fetch). Kept as a constant rather than state
  // since nothing currently updates it.
  const memberCounts: Record<string, number> = {}

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
        onDeleted={() => {
          setView("list")
          setSelectedRole(null)
        }}
      />
    )
  }

  return (
    <div className="w-full h-full bg-surface-chat">
      <RoleList
        selectedId={selectedRole?.id ?? null}
        onSelect={(_, role) => {
          setSelectedRole(role)
          setView("detail")
        }}
        memberCounts={memberCounts}
        onCreateClick={() => setView("create")}
      />
    </div>
  )
}
