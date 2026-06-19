'use client'

import { useState, useMemo, useEffect } from "react"
import { ChevronDown, ChevronRight, ClipboardList, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns"
import {
  ACTION_META,
  CATEGORY_LABELS,
  AuditEntry,
  ActionCategory,
  ActionType,
} from "@/constants/auditLog"
import { getAuditLogs } from "@/lib/server/actions/servers"

function mapActionTypeToCategory(type: string): ActionCategory {
  if (type.startsWith("member_")) return "member";
  if (type.startsWith("channel_")) return "channel";
  if (type.startsWith("role_")) return "role";
  if (type.startsWith("server_") || type.startsWith("safety_setup_")) return "server";
  if (type.startsWith("invite_")) return "invite";
  if (type.startsWith("message_")) return "message";
  return "server";
}


function relativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true })
}

function dateLabel(date: Date): string {
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  return format(date, "EEEE, MMMM d")
}

function groupByDate(entries: AuditEntry[]): { label: string; entries: AuditEntry[] }[] {
  const map = new Map<string, AuditEntry[]>()
  for (const entry of entries) {
    const label = dateLabel(entry.timestamp)
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(entry)
  }
  return Array.from(map.entries()).map(([label, entries]) => ({ label, entries }))
}


function ChangeRow({ field, before, after }: { field: string; before: string; after: string }) {
  return (
    <div className="flex items-start gap-3 text-xs py-1">
      <span className="text-white/30 min-w-28 shrink-0">{field}</span>
      <div className="flex items-center gap-2 flex-wrap">
        {before && (
          <span className="font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 line-through">
            {before}
          </span>
        )}
        {before && after && <span className="text-white/20">→</span>}
        {after && (
          <span className="font-mono px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
            {after}
          </span>
        )}
      </div>
    </div>
  )
}


function EntryRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false)
  const meta = ACTION_META[entry.type]
  const hasChanges = (entry.changes?.length ?? 0) > 0

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
          hasChanges ? "cursor-pointer hover:bg-white/3" : "",
          expanded && "bg-white/3 rounded-b-none"
        )}
        onClick={() => hasChanges && setExpanded((v) => !v)}
      >
        {/* Action icon */}
        <div className={cn("flex items-center justify-center size-8 rounded-lg shrink-0", meta.bg)}>
          <span className="size-2 rounded-full" style={{ backgroundColor: meta.dot }} />
        </div>

        {/* Actor avatar */}
        <div className={cn(
          "size-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0",
          entry.actor.color
        )}>
          {entry.actor.initials}
        </div>

        {/* Description */}
        <p className="flex-1 text-sm min-w-0">
          <span className="text-white font-medium">{entry.actor.name}</span>
          {" "}
          <span className={cn("font-medium", meta.color)}>{ACTION_META[entry.type].verb}</span>
          {" "}
          <span className="text-white/60">{entry.target}</span>
        </p>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-white/25">{relativeTime(entry.timestamp)}</span>
          {hasChanges && (
            <span className="text-white/30">
              {expanded
                ? <ChevronDown size={14} />
                : <ChevronRight size={14} />
              }
            </span>
          )}
        </div>
      </div>

      {/* Expanded changes */}
      {expanded && entry.changes && (
        <div className="px-4 pb-3 pt-2 rounded-b-xl bg-white/3 border-t border-white/5 ml-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-2 px-11">
            Changes
          </p>
          <div className="px-11 flex flex-col gap-0.5">
            {entry.changes.map((c, i) => (
              <ChangeRow key={i} {...c} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── filter bar ───────────────────────────────────────────────────────────────

const ALL_CATEGORIES: { value: ActionCategory | "all"; label: string }[] = [
  { value: "all", label: "All Actions" },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value: value as ActionCategory,
    label,
  })),
]

function FilterBar({
  query,
  category,
  onQuery,
  onCategory,
}: {
  query: string
  category: ActionCategory | "all"
  onQuery: (v: string) => void
  onCategory: (v: ActionCategory | "all") => void
}) {
  return (
    <div className="flex items-center gap-3">
      {/* Search */}
      <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus-within:border-white/20 transition-colors">
        <Search size={13} className="text-white/30 shrink-0" />
        <input
          type="text"
          placeholder="Filter by user..."
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
        />
        {query && (
          <button onClick={() => onQuery("")} className="text-white/25 hover:text-white/60 text-xs">✕</button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-1 flex-wrap">
        {ALL_CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onCategory(c.value)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
              category === c.value
                ? "bg-white/15 text-white"
                : "text-white/35 hover:text-white/60 hover:bg-white/5"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── root ─────────────────────────────────────────────────────────────────────

export default function AuditLog({ serverId }: { serverId: string }) {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<ActionCategory | "all">("all")

  useEffect(() => {
    async function loadLogs() {
      const { error, data } = await getAuditLogs(serverId)
      if (!error && data) {
        const mapped: AuditEntry[] = data.map((entry: any) => {
          const name = entry.actor_name || "Unknown User";
          return {
            id: entry.id,
            type: entry.action_type as ActionType,
            category: mapActionTypeToCategory(entry.action_type),
            actor: {
              id: entry.actor_id,
              name: name,
              initials: name.slice(0, 2).toUpperCase(),
              color: "bg-indigo-500/20 text-indigo-400",
            },
            target: entry.target,
            timestamp: new Date(entry.created_at),
            changes: entry.changes?.map((c: any) => ({
              field: c.field,
              before: c.before || "",
              after: c.after || "",
            })),
          }
        })
        setLogs(mapped)
      }
    }
    loadLogs()
  }, [serverId])

  const filtered = useMemo(() => {
    return logs.filter((e) => {
      const matchesQuery = query === "" || e.actor.name.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = category === "all" || e.category === category
      return matchesQuery && matchesCategory
    })
  }, [logs, query, category])

  const groups = useMemo(() => groupByDate(filtered), [filtered])

  return (
    <div className="flex flex-col w-full max-h-screen overflow-hidden text-white">

      {/* Header */}
      <div className="px-8 pt-8 pb-5 shrink-0 border-b border-white/5">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center size-10 rounded-xl bg-indigo-500/15">
            <ClipboardList size={20} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="font-semibold text-xl">Audit Log</h2>
            <p className="text-sm text-white/40 mt-0.5">
              {filtered.length} of {logs.length} action{logs.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <FilterBar
          query={query}
          category={category}
          onQuery={setQuery}
          onCategory={setCategory}
        />
      </div>

      {/* Log */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/25 gap-3">
            <ClipboardList size={32} className="opacity-40" />
            <p className="text-sm">No actions found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map(({ label, entries }) => (
              <div key={label}>
                {/* Date group header */}
                <div className="flex items-center gap-3 px-4 mb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 whitespace-nowrap">
                    {label}
                  </p>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[11px] text-white/20">{entries.length}</span>
                </div>

                {/* Entries */}
                <div className="flex flex-col gap-0.5">
                  {entries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
