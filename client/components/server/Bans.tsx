'use client'

import { useState, useMemo } from "react"
import { Ban, Search, ShieldOff, RotateCcw } from "lucide-react"
import { unbanMember } from "@/lib/actions/servers"
import { format } from "date-fns"
import { getBans } from "@/lib/api/bans"
import useSWR from "swr"
import { EmptyState } from "@/components/ui/empty-state"
import { Avatar } from "@/components/ui/avatar"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "@/components/ui/toast"


type BannedMember = {
  id: string
  name: string
  initials: string
  color: string
  reason: string | null
  bannedAt: Date | string
  bannedBy: string
}




function formatDate(dateInput: Date | string) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
  return format(date, "MMM d, yyyy")
}


function UnbanConfirm({ name, onConfirm, onCancel }: {
  name: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <ConfirmDialog
      className="p-2 md:p-6"
      icon={<ShieldOff size={20} />}
      tone="success"
      title="Revoke ban"
      subtitle="This action cannot be undone"
      description={
        <>
          Are you sure you want to unban{" "}
          <span className="text-white font-medium">{name}</span>? They will be able to rejoin the server with a new invite.
        </>
      }
      confirmLabel="Unban"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}


function BanRow({ member, onUnban }: { member: BannedMember; onUnban: () => void }) {
  return (
    <div className="flex items-center gap-4 px-2 md:px-5 py-3.5 rounded-xl bg-white/2 border border-white/5 hover:bg-white/4 transition-colors group">

      <Avatar
        size={40}
        alt={member.name}
        fallback={member.initials}
        fallbackClassName={member.color}
      />

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


export default function Bans({ serverId }: { serverId: string }) {
  const [query, setQuery] = useState("")
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const { data: bans = [], error, isLoading, mutate } = useSWR(() => serverId ? "/api/bans" : null, () => getBans(serverId))

  const filtered = useMemo(() =>
    bans.filter((b) => b.name.toLowerCase().includes(query.toLowerCase())),
    [bans, query]
  )

  if (isLoading) return "loading bans"
  if (error) return "failed to get banned members"

  const confirmTarget = bans.find((b) => b.id === confirmId)

  const handleUnban = async () => {
    if (confirmId === null) return
    const res = await unbanMember(serverId, confirmId)
    if (res && res.success) {
      mutate()
    } else {
      toast.add({ title: res.message, type: "error" })
    }
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

      <div className="px-2 md:px-8 pt-8 pb-5 shrink-0 border-b border-white/5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-red-500/15">
              <Ban size={20} className="text-red-400" />
            </div>
            <div>
              <h2 className="font-semibold text-lg md:text-xl">Bans</h2>
              <p className="text-xs md:text-sm text-white/40 mt-0.5">
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
          <EmptyState
            icon={<Ban size={32} className="opacity-40" />}
            title={query ? "No matching bans" : "No banned members"}
          />
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
