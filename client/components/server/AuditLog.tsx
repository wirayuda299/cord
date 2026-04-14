'use client'

import { useState, useMemo } from "react"
import { ChevronDown, ChevronRight, ClipboardList, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AUDIT_LOG,
  ACTION_META,
  CATEGORY_LABELS,
  AuditEntry,
  ActionCategory,
} from "@/constants/auditLog"

// ─── helpers ──────────────────────────────────────────────────────────────────

function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60)          return "just now"
  if (diff < 3600)        return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)       return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7)   return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function dateLabel(date: Date): string {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff  = Math.floor((today.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return "Today"
  if (diff === 1) return "Yesterday"
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
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

// ─── change row ───────────────────────────────────────────────────────────────

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

// ─── entry row ────────────────────────────────────────────────────────────────

function EntryRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false)
  const meta     = ACTION_META[entry.type]
  const hasChanges = (entry.changes?.length ?? 0) > 0

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
          hasChanges ? "cursor-pointer hover:bg-white/[0.03]" : "",
          expanded && "bg-white/[0.03] rounded-b-none"
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
        <div className="px-4 pb-3 pt-2 rounded-b-xl bg-white/[0.03] border-t border-white/5 ml-0">
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
  { value: "all",     label: "All Actions" },
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

export default function AuditLog() {
  const [query,    setQuery]    = useState("")
  const [category, setCategory] = useState<ActionCategory | "all">("all")

  const filtered = useMemo(() => {
    return AUDIT_LOG.filter((e) => {
      const matchesQuery    = query === "" || e.actor.name.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = category === "all" || e.category === category
      return matchesQuery && matchesCategory
    })
  }, [query, category])

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
              {filtered.length} of {AUDIT_LOG.length} action{AUDIT_LOG.length !== 1 ? "s" : ""}
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
