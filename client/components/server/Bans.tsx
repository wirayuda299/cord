'use client'

import { useState, useMemo } from "react"
import { Ban, Search, ShieldOff, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"


type BannedMember = {
  id: number
  name: string
  initials: string
  color: string
  reason: string | null
  bannedAt: Date
  bannedBy: string
}

const d = (daysAgo: number) => {
  const t = new Date("2026-04-13T12:00:00Z")
  t.setDate(t.getDate() - daysAgo)
  return t
}

const BANNED: BannedMember[] = [
  { id: 1, name: "draven_x", initials: "DX", color: "bg-orange-500/20 text-orange-400", reason: "Repeated harassment of members", bannedAt: d(1), bannedBy: "alexknight" },
  { id: 2, name: "wraithmode", initials: "WM", color: "bg-zinc-500/20 text-zinc-400", reason: "Spamming invite links", bannedAt: d(3), bannedBy: "frost_byte" },
  { id: 3, name: "cipher_k", initials: "CK", color: "bg-zinc-500/20 text-zinc-400", reason: "Sharing explicit content", bannedAt: d(7), bannedBy: "alexknight" },
  { id: 4, name: "solaris_7", initials: "S7", color: "bg-zinc-500/20 text-zinc-400", reason: null, bannedAt: d(12), bannedBy: "sakura_r" },
  { id: 5, name: "riptide99", initials: "RT", color: "bg-zinc-500/20 text-zinc-400", reason: "Doxxing attempt", bannedAt: d(18), bannedBy: "alexknight" },
  { id: 6, name: "ironclad", initials: "IC", color: "bg-zinc-500/20 text-zinc-400", reason: "Bot / automated account", bannedAt: d(24), bannedBy: "frost_byte" },
  { id: 7, name: "shadowvex", initials: "SV", color: "bg-red-500/20 text-red-400", reason: "Threatening other members", bannedAt: d(30), bannedBy: "alexknight" },
  { id: 8, name: "nullptr", initials: "NP", color: "bg-gray-500/20 text-gray-400", reason: "Evading a previous ban", bannedAt: d(35), bannedBy: "sakura_r" },
  { id: 9, name: "xpl0it", initials: "XP", color: "bg-red-500/20 text-red-400", reason: "Posting malware / phishing links", bannedAt: d(42), bannedBy: "alexknight" },
  { id: 10, name: "void_runner", initials: "VR", color: "bg-gray-500/20 text-gray-400", reason: null, bannedAt: d(60), bannedBy: "frost_byte" },
]


function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}


function UnbanConfirm({ name, onConfirm, onCancel }: {
  name: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-sidebar-primary border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 flex flex-col gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-green-500/15 shrink-0">
            <ShieldOff size={20} className="text-green-400" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Revoke ban</p>
            <p className="text-xs text-white/40 mt-0.5">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-white/60 leading-relaxed">
          Are you sure you want to unban{" "}
          <span className="text-white font-medium">{name}</span>? They will be able to rejoin the server with a new invite.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-500 text-white transition-colors"
          >
            Unban
          </button>
        </div>
      </div>
    </div>
  )
}


function BanRow({ member, onUnban }: { member: BannedMember; onUnban: () => void }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 rounded-xl bg-white/2 border border-white/5 hover:bg-white/4 transition-colors group">

      <div className={cn(
        "size-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
        member.color
      )}>
        {member.initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white truncate">{member.name}</p>
          {!member.reason && (
            <span className="text-[10px] text-white/25 border border-white/10 rounded-full px-1.5 py-px shrink-0">
              No reason
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {member.reason && (
            <p className="text-xs text-white/40 truncate">{member.reason}</p>
          )}
          <p className="text-xs text-white/20 shrink-0">
            by <span className="text-white/35">{member.bannedBy}</span> · {formatDate(member.bannedAt)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onUnban}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/30 hover:text-green-400 hover:bg-green-500/10 border border-transparent hover:border-green-500/20 transition-all opacity-0 group-hover:opacity-100"
      >
        <RotateCcw size={12} />
        Unban
      </button>
    </div>
  )
}

// ─── root ─────────────────────────────────────────────────────────────────────

export default function Bans() {
  const [bans, setBans] = useState(BANNED)
  const [query, setQuery] = useState("")
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const filtered = useMemo(() =>
    bans.filter((b) => b.name.toLowerCase().includes(query.toLowerCase())),
    [bans, query]
  )

  const confirmTarget = bans.find((b) => b.id === confirmId)

  const handleUnban = () => {
    if (confirmId === null) return
    setBans((prev) => prev.filter((b) => b.id !== confirmId))
    // TODO: call unban server action
    setConfirmId(null)
  }

  return (
    <div className="flex flex-col w-full max-h-screen overflow-hidden text-white">

      {confirmTarget && (
        <UnbanConfirm
          name={confirmTarget.name}
          onConfirm={handleUnban}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <div className="px-8 pt-8 pb-5 shrink-0 border-b border-white/5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-red-500/15">
              <Ban size={20} className="text-red-400" />
            </div>
            <div>
              <h2 className="font-semibold text-xl">Bans</h2>
              <p className="text-sm text-white/40 mt-0.5">
                {bans.length} banned member{bans.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus-within:border-white/20 transition-colors">
          <Search size={13} className="text-white/30 shrink-0" />
          <input
            type="text"
            placeholder="Search banned members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-white/25 hover:text-white/60 text-xs">✕</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/25 gap-3">
            <Ban size={32} className="opacity-40" />
            <p className="text-sm">{query ? "No matching bans" : "No banned members"}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-5 pb-1">
              <span />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25">Member</p>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 pr-2">Action</p>
            </div>

            {filtered.map((member) => (
              <BanRow
                key={member.id}
                member={member}
                onUnban={() => setConfirmId(member.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
