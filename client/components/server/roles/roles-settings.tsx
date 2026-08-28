"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Role } from "@/types/role"
import RoleList from "./list"
import RoleDetailView from "./role-detail-view"
import RoleFormView from "./role-form-view"
import { getAllMembers } from "@/lib/api/members"

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
