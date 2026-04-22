import { assignRole, unassignRole } from "@/lib/client/api/roles"
import { useState } from "react"

type Props = {
  member: {
    user_id: string
    role_id: string | null
  }
  serverOwner: string
  serverID: string
  onMutate: () => void
}

export default function useToggleRoleMember({ serverID, member, onMutate, serverOwner }: Props) {
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isOwner = member?.user_id === serverOwner

  const handleToggleRole = async (roleID: string) => {
    if (isOwner || pendingRoleId) return
    setError(null)
    setPendingRoleId(roleID)
    try {
      if (member.role_id === roleID) {
        await unassignRole(member.user_id, serverID, roleID)
      } else {
        if (member.role_id) {
          await unassignRole(member.user_id, serverID, member.role_id)
        }
        await assignRole(member.user_id, serverID, roleID, "usr_001")
      }
      onMutate()
    } catch (err) {
      console.log(err)
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setPendingRoleId(null)
    }
  }

  return { error, pendingRoleId, handleToggleRole, setError }
}
