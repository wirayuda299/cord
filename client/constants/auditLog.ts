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

export type AuditActor = {
  id: number
  name: string
  initials: string
  color: string
}

export type AuditChange = {
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
  member_kicked:       { label: "Member Kicked",         verb: "kicked",               color: "text-orange-400",  bg: "bg-orange-500/15",  dot: "#e67e22" },
  member_banned:       { label: "Member Banned",         verb: "banned",               color: "text-red-400",     bg: "bg-red-500/15",     dot: "#ed4245" },
  member_unbanned:     { label: "Member Unbanned",       verb: "unbanned",             color: "text-green-400",   bg: "bg-green-500/15",   dot: "#57f287" },
  member_timeout:      { label: "Member Timed Out",      verb: "timed out",            color: "text-yellow-400",  bg: "bg-yellow-500/15",  dot: "#f1c40f" },
  member_role_updated: { label: "Member Roles Updated",  verb: "updated roles for",    color: "text-blue-400",    bg: "bg-blue-500/15",    dot: "#5865f2" },
  channel_created:     { label: "Channel Created",       verb: "created channel",      color: "text-green-400",   bg: "bg-green-500/15",   dot: "#57f287" },
  channel_deleted:     { label: "Channel Deleted",       verb: "deleted channel",      color: "text-red-400",     bg: "bg-red-500/15",     dot: "#ed4245" },
  channel_updated:     { label: "Channel Updated",       verb: "updated channel",      color: "text-blue-400",    bg: "bg-blue-500/15",    dot: "#5865f2" },
  role_created:        { label: "Role Created",          verb: "created role",         color: "text-green-400",   bg: "bg-green-500/15",   dot: "#57f287" },
  role_deleted:        { label: "Role Deleted",          verb: "deleted role",         color: "text-red-400",     bg: "bg-red-500/15",     dot: "#ed4245" },
  role_updated:        { label: "Role Updated",          verb: "updated role",         color: "text-purple-400",  bg: "bg-purple-500/15",  dot: "#9b59b6" },
  server_updated:      { label: "Server Updated",        verb: "updated server",       color: "text-indigo-400",  bg: "bg-indigo-500/15",  dot: "#5865f2" },
  invite_created:      { label: "Invite Created",        verb: "created invite",       color: "text-teal-400",    bg: "bg-teal-500/15",    dot: "#1abc9c" },
  invite_deleted:      { label: "Invite Deleted",        verb: "deleted invite",       color: "text-orange-400",  bg: "bg-orange-500/15",  dot: "#e67e22" },
  message_deleted:     { label: "Message Deleted",       verb: "deleted a message in", color: "text-red-400",     bg: "bg-red-500/15",     dot: "#ed4245" },
  message_pinned:      { label: "Message Pinned",        verb: "pinned a message in",  color: "text-yellow-400",  bg: "bg-yellow-500/15",  dot: "#f1c40f" },
}

export const CATEGORY_LABELS: Record<ActionCategory, string> = {
  member:  "Member",
  channel: "Channel",
  role:    "Role",
  server:  "Server",
  invite:  "Invite",
  message: "Message",
}

// ─── mock actors ──────────────────────────────────────────────────────────────

const alexknight: AuditActor = { id: 1,  name: "alexknight",  initials: "AK", color: "bg-indigo-500/20 text-indigo-400" }
const sakura:     AuditActor = { id: 2,  name: "sakura_r",    initials: "SR", color: "bg-yellow-500/20 text-yellow-400" }
const frostbyte:  AuditActor = { id: 11, name: "frost_byte",  initials: "FB", color: "bg-sky-500/20 text-sky-400" }

// ─── mock data ────────────────────────────────────────────────────────────────

const d = (daysAgo: number, hoursAgo = 0) => {
  const t = new Date("2026-04-13T12:00:00Z")
  t.setDate(t.getDate() - daysAgo)
  t.setHours(t.getHours() - hoursAgo)
  return t
}

export const AUDIT_LOG: AuditEntry[] = [
  {
    id: "1",
    type: "member_banned",
    category: "member",
    actor: alexknight,
    target: "draven_x",
    timestamp: d(0, 1),
  },
  {
    id: "2",
    type: "role_updated",
    category: "role",
    actor: sakura,
    target: "@Moderator",
    timestamp: d(0, 2),
    changes: [
      { field: "Kick Members",   before: "false", after: "true" },
      { field: "Ban Members",    before: "false", after: "true" },
      { field: "Manage Messages",before: "true",  after: "true" },
    ],
  },
  {
    id: "3",
    type: "channel_created",
    category: "channel",
    actor: alexknight,
    target: "#announcements",
    timestamp: d(0, 3),
  },
  {
    id: "4",
    type: "invite_created",
    category: "invite",
    actor: sakura,
    target: "aB3xK9mZ2Q (max 10)",
    timestamp: d(0, 5),
  },
  {
    id: "5",
    type: "member_timeout",
    category: "member",
    actor: frostbyte,
    target: "neon_ghost",
    timestamp: d(0, 7),
  },
  {
    id: "6",
    type: "server_updated",
    category: "server",
    actor: alexknight,
    target: "server settings",
    timestamp: d(1, 0),
    changes: [
      { field: "Verification Level",  before: "None",   after: "Low" },
      { field: "Content Filter",      before: "Disabled", after: "Scan roleless members" },
    ],
  },
  {
    id: "7",
    type: "channel_updated",
    category: "channel",
    actor: sakura,
    target: "#general",
    timestamp: d(1, 2),
    changes: [
      { field: "Topic", before: "", after: "Welcome to the server! Read #rules first." },
      { field: "NSFW",  before: "false", after: "false" },
    ],
  },
  {
    id: "8",
    type: "member_kicked",
    category: "member",
    actor: frostbyte,
    target: "wraithmode",
    timestamp: d(1, 4),
  },
  {
    id: "9",
    type: "role_created",
    category: "role",
    actor: alexknight,
    target: "@VIP",
    timestamp: d(2, 1),
  },
  {
    id: "10",
    type: "message_deleted",
    category: "message",
    actor: sakura,
    target: "#general",
    timestamp: d(2, 3),
  },
  {
    id: "11",
    type: "member_role_updated",
    category: "member",
    actor: alexknight,
    target: "frost_byte",
    timestamp: d(2, 5),
    changes: [
      { field: "Added role",   before: "", after: "@Moderator" },
    ],
  },
  {
    id: "12",
    type: "invite_deleted",
    category: "invite",
    actor: alexknight,
    target: "xR7pL2qN5T",
    timestamp: d(3, 0),
  },
  {
    id: "13",
    type: "channel_deleted",
    category: "channel",
    actor: alexknight,
    target: "#old-announcements",
    timestamp: d(3, 2),
  },
  {
    id: "14",
    type: "member_unbanned",
    category: "member",
    actor: alexknight,
    target: "riptide99",
    timestamp: d(4, 1),
  },
  {
    id: "15",
    type: "message_pinned",
    category: "message",
    actor: sakura,
    target: "#rules",
    timestamp: d(5, 3),
  },
  {
    id: "16",
    type: "role_deleted",
    category: "role",
    actor: alexknight,
    target: "@Trial-Mod",
    timestamp: d(6, 0),
  },
]
