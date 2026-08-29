"use client"

import { useState, useMemo, useEffect } from "react"
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns"
import {
  ACTION_META,
  CATEGORY_LABELS,
  AuditEntry,
  ActionCategory,
  ActionType,
} from "@/constants/auditLog"
import { getAuditLogs } from "@/lib/actions/audit"
import { EmptyState } from "@/components/ui/empty-state"
import { Avatar } from "@/components/ui/avatar"




function mapActionTypeToCategory(type: string): ActionCategory {
  if (type.startsWith("member_")) return "member"
  if (type.startsWith("channel_")) return "channel"
  if (type.startsWith("role_")) return "role"
  if (type.startsWith("server_") || type.startsWith("safety_setup_")) return "server"
  if (type.startsWith("invite_")) return "invite"
  if (type.startsWith("message_")) return "message"
  return "server"
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
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 text-xs py-1 min-w-0">
      <span className="text-white/30 sm:min-w-28 shrink-0">{field}</span>
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        {before && (
          <span className="font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 line-through break-all">
            {before}
          </span>
        )}
        {before && after && <span className="text-white/20">→</span>}
        {after && (
          <span className="font-mono px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 break-all">
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
    <div className="flex flex-col min-w-0">
      <button
        type="button"
        disabled={!hasChanges}
        aria-expanded={hasChanges ? expanded : undefined}
        className={cn(
          "w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl transition-colors text-left min-w-0",
          hasChanges ? "cursor-pointer hover:bg-white/3" : "cursor-default",
          expanded && "bg-white/3 rounded-b-none",
        )}
        onClick={() => hasChanges && setExpanded((v) => !v)}
      >
        {/* Action icon */}
        <div className={cn("flex items-center justify-center size-8 rounded-lg shrink-0", meta.bg)}>
          <span className="size-2 rounded-full" style={{ backgroundColor: meta.dot }} />
        </div>

        {/* Actor avatar */}
        <Avatar
          size={28}
          alt={entry.actor.name}
          fallback={entry.actor.initials}
          fallbackClassName={cn(entry.actor.color, "text-[10px]")}
        />

        {/* Description */}
        <p className="flex-1 min-w-0 text-sm truncate sm:whitespace-normal">
          <span className="text-white font-medium">{entry.actor.name}</span>{" "}
          <span className={cn("font-medium", meta.color)}>{meta.verb}</span>{" "}
          <span className="text-white/60">{entry.target}</span>
        </p>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-white/25 hidden sm:inline">{relativeTime(entry.timestamp)}</span>
          {hasChanges && (
            <span className="text-white/30">
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
        </div>
      </button>

      {/* Timestamp on its own line on mobile, where it's hidden above */}
      <span className="sm:hidden text-[11px] text-white/25 px-3 -mt-1.5 mb-1">
        {relativeTime(entry.timestamp)}
      </span>

      {/* Expanded changes */}
      {expanded && entry.changes && (
        <div className="px-3 sm:px-4 pb-3 pt-2 rounded-b-xl bg-white/3 border-t border-white/5 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-2 px-8 sm:px-11">
            Changes
          </p>
          <div className="px-8 sm:px-11 flex flex-col gap-0.5 min-w-0">
            {entry.changes.map((c, i) => (
              <ChangeRow key={i} {...c} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


const ALL_CATEGORIES: { value: ActionCategory | "all"; label: string }[] = [
  { value: "all", label: "All Actions" },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value: value as ActionCategory,
    label,
  })),
]

function CategoryPills({
  category,
  onCategory,
}: {
  category: ActionCategory | "all"
  onCategory: (v: ActionCategory | "all") => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 min-w-0 sm:max-w-[60%]">
      {ALL_CATEGORIES.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onCategory(c.value)}
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
            category === c.value
              ? "bg-white/15 text-white"
              : "text-white/35 hover:text-white/60 hover:bg-white/5",
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}

// ─── filter bar ───────────────────────────────────────────────────────────────

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
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 min-w-0 w-full">
      {/* Search */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus-within:border-white/20 transition-colors w-full sm:flex-1 sm:min-w-0">
        <Search size={13} className="text-white/30 shrink-0" />
        <input
          type="text"
          placeholder="Filter by user..."
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          className="flex-1 min-w-0 w-full bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQuery("")}
            aria-label="Clear search"
            className="text-white/25 hover:text-white/60 text-xs shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      <CategoryPills category={category} onCategory={onCategory} />
    </div>
  )
}


function LogSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-1 py-2 animate-pulse" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-white/3" />
      ))}
    </div>
  )
}


export default function AuditLog({ serverId }: { serverId: string }) {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<ActionCategory | "all">("all")

  useEffect(() => {
    let cancelled = false

    async function loadLogs() {
      setStatus("loading")
      try {
        const { error, data } = await getAuditLogs(serverId)
        if (cancelled) return

        if (error || !data) {
          setStatus("error")
          return
        }

        const mapped = data.map((entry: { actor_name: string; id: any; action_type: string; actor_id: any; target: any; created_at: string | number | Date; changes: any[] }) => {
          const name = entry.actor_name || "Unknown User"
          return {
            id: entry.id,
            type: entry.action_type as ActionType,
            category: mapActionTypeToCategory(entry.action_type),
            actor: {
              id: entry.actor_id,
              name,
              initials: name.slice(0, 2).toUpperCase(),
              color: "bg-indigo-500/20 text-indigo-400",
            },
            target: entry.target,
            timestamp: new Date(entry.created_at),
            changes: entry.changes?.map((c) => ({
              field: c.field,
              before: c.before || "",
              after: c.after || "",
            })),
          }
        })
        setLogs(mapped)
        setStatus("ready")
      } catch {
        if (!cancelled) setStatus("error")
      }
    }

    loadLogs()
    return () => {
      cancelled = true
    }
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
    <div className="flex flex-col w-full h-full overflow-hidden text-white min-w-0">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-5 shrink-0 border-b border-white/5 min-w-0">
        <div className="flex items-center gap-3 mb-5 min-w-0">
          <div className="flex items-center justify-center size-10 rounded-xl bg-indigo-500/15 shrink-0">
            <ClipboardList size={20} className="text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-xl">Audit Log</h2>
            <p className="text-sm text-white/40 mt-0.5">
              {status !== "loading" &&
                `${filtered.length} of ${logs.length} action${logs.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <FilterBar query={query} category={category} onQuery={setQuery} onCategory={setCategory} />
      </div>

      {/* Log */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 min-w-0">
        {status === "loading" ? (
          <LogSkeleton />
        ) : status === "error" ? (
          <EmptyState
            className="text-white/40 px-4 text-center"
            icon={<AlertTriangle size={28} className="opacity-50 text-red-400" />}
            title="Couldn't load the audit log. Please try again."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={32} className="opacity-40" />}
            title="No actions found"
          />
        ) : (
          <div className="flex flex-col gap-6 min-w-0">
            {groups.map(({ label, entries }) => (
              <div key={label} className="min-w-0">
                {/* Date group header */}
                <div className="flex items-center gap-3 px-2 sm:px-4 mb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 whitespace-nowrap">
                    {label}
                  </p>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[11px] text-white/20">{entries.length}</span>
                </div>

                {/* Entries */}
                <div className="flex flex-col gap-0.5 min-w-0">
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
