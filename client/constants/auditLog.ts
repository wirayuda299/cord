export type ActionCategory = "member" | "channel" | "role" | "server" | "invite" | "message"

export type ActionType =
  | "member_kicked"
  | "member_banned"
  | "member_unbanned"
  | "member_timeout"
  | "member_role_updated"
  | "channel_created"
  | "channel_deleted"
  | "channel_updated"
  | "role_created"
  | "role_deleted"
  | "role_updated"
  | "server_updated"
  | "invite_created"
  | "invite_deleted"
  | "message_deleted"
  | "message_pinned"
  | "safety_setup_updated"

type AuditActor = {
  id: number
  name: string
  initials: string
  color: string
}

type AuditChange = {
  field: string
  before: string
  after: string
}

export type AuditEntry = {
  id: string
  type: ActionType
  category: ActionCategory
  actor: AuditActor
  target: string
  timestamp: Date
  changes?: AuditChange[]
}

export type ActionMeta = {
  label: string
  verb: string       // "banned", "created #general", etc. (target appended after)
  color: string      // tailwind text color
  bg: string         // tailwind bg color
  dot: string        // hex for the timeline dot
}

export const ACTION_META: Record<ActionType, ActionMeta> = {
  member_kicked: { label: "Member Kicked", verb: "kicked", color: "text-orange-400", bg: "bg-orange-500/15", dot: "#e67e22" },
  member_banned: { label: "Member Banned", verb: "banned", color: "text-red-400", bg: "bg-red-500/15", dot: "#ed4245" },
  member_unbanned: { label: "Member Unbanned", verb: "unbanned", color: "text-green-400", bg: "bg-green-500/15", dot: "#57f287" },
  member_timeout: { label: "Member Timed Out", verb: "timed out", color: "text-yellow-400", bg: "bg-yellow-500/15", dot: "#f1c40f" },
  member_role_updated: { label: "Member Roles Updated", verb: "updated roles for", color: "text-blue-400", bg: "bg-blue-500/15", dot: "#5865f2" },
  channel_created: { label: "Channel Created", verb: "created channel", color: "text-green-400", bg: "bg-green-500/15", dot: "#57f287" },
  channel_deleted: { label: "Channel Deleted", verb: "deleted channel", color: "text-red-400", bg: "bg-red-500/15", dot: "#ed4245" },
  channel_updated: { label: "Channel Updated", verb: "updated channel", color: "text-blue-400", bg: "bg-blue-500/15", dot: "#5865f2" },
  role_created: { label: "Role Created", verb: "created role", color: "text-green-400", bg: "bg-green-500/15", dot: "#57f287" },
  role_deleted: { label: "Role Deleted", verb: "deleted role", color: "text-red-400", bg: "bg-red-500/15", dot: "#ed4245" },
  role_updated: { label: "Role Updated", verb: "updated role", color: "text-purple-400", bg: "bg-purple-500/15", dot: "#9b59b6" },
  server_updated: { label: "Server Updated", verb: "updated server", color: "text-indigo-400", bg: "bg-indigo-500/15", dot: "#5865f2" },
  invite_created: { label: "Invite Created", verb: "created invite", color: "text-teal-400", bg: "bg-teal-500/15", dot: "#1abc9c" },
  invite_deleted: { label: "Invite Deleted", verb: "deleted invite", color: "text-orange-400", bg: "bg-orange-500/15", dot: "#e67e22" },
  message_deleted: { label: "Message Deleted", verb: "deleted a message in", color: "text-red-400", bg: "bg-red-500/15", dot: "#ed4245" },
  message_pinned: { label: "Message Pinned", verb: "pinned a message in", color: "text-yellow-400", bg: "bg-yellow-500/15", dot: "#f1c40f" },
  safety_setup_updated: { label: "Safety Setup Updated", verb: "updated safety settings for", color: "text-green-400", bg: "bg-green-500/15", dot: "#57f287" },
}

export const CATEGORY_LABELS: Record<ActionCategory, string> = {
  member: "Member",
  channel: "Channel",
  role: "Role",
  server: "Server",
  invite: "Invite",
  message: "Message",
}
