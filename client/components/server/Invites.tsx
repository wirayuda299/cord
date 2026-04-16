
import { useState } from "react"
import { Copy, Check, Trash2, Plus, Link, Users, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { copyText } from "@/lib/client/clipboard"
import useSWR from "swr"
import { createInvitationCode } from "@/lib/server/actions/invitations"
import { Invitation } from "@/lib/types/invitation"
import { deleteInvitationCode, getAllInvitation } from "@/lib/client/api/invitation"



function UsageBar({ uses, maxUsers }: { uses: number; maxUsers: number }) {
  const pct = maxUsers === 0 ? 0 : Math.min((uses / maxUsers) * 100, 100)
  const full = uses >= maxUsers

  return (
    <div className="flex flex-col gap-1.5 min-w-32">
      <div className="flex items-center justify-between text-xs">
        <span className={cn("font-medium", full ? "text-red-400" : "text-white")}>
          {uses}
        </span>
        <span className="text-white/30">/ {maxUsers}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            full ? "bg-red-500" : pct > 75 ? "bg-yellow-500" : "bg-discord-blue"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handle = () => {
    copyText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      type="button"
      onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-colors"
    >
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}

function InviteRow({
  invite,
  onDelete,
}: {
  invite: Invitation
  onDelete: (code: string) => void
}) {
  const full = invite.uses >= invite.max_users
  const date = new Date(invite.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })

  const code = `http://localhost:3000/invite/${invite.code}?server_id=${invite.server_id}`

  return (
    <div className={cn(
      "grid grid-cols-[1fr_9rem_7rem_auto] items-center gap-4 px-4 py-3.5 rounded-xl border transition-colors",
      full
        ? "bg-red-500/5 border-red-500/15"
        : "bg-white/2 border-white/5 hover:bg-white/4"
    )}>

      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center justify-center size-8 rounded-lg bg-discord-blue/15 shrink-0">
          <Link size={13} className="text-discord-blue" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-mono text-white truncate max-w-xs">{code}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock size={10} className="text-white/25 shrink-0" />
            <p className="text-xs text-white/30">Created {date}</p>
            {full && (
              <span className="text-[10px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-1.5 py-px ml-1">
                Full
              </span>
            )}
          </div>
        </div>
      </div>

      <UsageBar uses={invite.uses} maxUsers={invite.max_users} />

      <div className="flex items-center gap-1.5 text-xs text-white/40">
        <Users size={11} className="shrink-0" />
        {invite.max_users} max
      </div>

      <div className="flex items-center gap-2">
        <CopyButton code={code} />
        <button
          type="button"
          onClick={() => onDelete(invite.code)}
          className="flex items-center justify-center size-7 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

function CreateInviteForm({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (maxUsers: number) => void
}) {
  const [maxUsers, setMaxUsers] = useState(10)

  const PRESETS = [5, 10, 25, 50, 100]

  return (
    <div className="rounded-xl border border-discord-blue/30 bg-discord-blue/5 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">New Invite Link</p>
        <button
          type="button"
          onClick={onClose}
          className="text-white/30 hover:text-white/60 text-xs transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-white/40">
          Max Uses
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMaxUsers(n)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                maxUsers === n
                  ? "bg-discord-blue border-discord-blue text-white"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
              )}
            >
              {n}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={255}
            value={maxUsers}
            onChange={(e) => setMaxUsers(Math.min(255, Math.max(1, Number(e.target.value))))}
            className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-white/25 transition-colors"
          />
        </div>
        <p className="text-xs text-white/25">Maximum number of times this link can be used (1–255)</p>
      </div>

      <button
        type="button"
        onClick={() => onCreate(maxUsers)}
        className="self-start flex items-center gap-2 px-4 py-2 rounded-lg bg-discord-blue hover:opacity-90 text-white text-sm font-medium transition-opacity"
      >
        <Plus size={14} />
        Generate Link
      </button>
    </div>
  )
}

export default function Invites({ serverID }: { serverID: string }) {
  const [creating, setCreating] = useState(false)

  const { data, isLoading } = useSWR("/api/invitations", () => getAllInvitation(serverID))
  const handleDelete = async (code: string) => {
    try {

      return await deleteInvitationCode(code, "usr_001").then(r => alert("Code deleted"))
    } catch (e) {
      alert(e)
    }
  }

  const handleCreate = async (maxUsers: number) => {

    try {
      const res = await createInvitationCode(serverID, maxUsers)
      if (res && "error" in res) {
        alert(res.error)
        return
      }
      alert("Invitation code created")

    } catch (e) {
      alert(e)

    }
    setCreating(false)
  }


  return (
    <phantom-ui loading={isLoading}>
      <div className="flex flex-col w-full max-h-screen overflow-hidden text-white">
        <div className="px-8 pt-8 pb-5 shrink-0 border-b border-white/5">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-semibold text-xl">Invites</h2>
              <p className="text-sm text-white/40 mt-0.5">
                {data?.length} invite{data?.length !== 1 ? "s" : ""}               </p>
            </div>
            <button
              type="button"
              onClick={() => setCreating((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-discord-blue hover:opacity-90 text-white text-sm font-medium transition-opacity"
            >
              <Plus size={14} />
              Create Invite
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-5 flex flex-col gap-3">
          {creating && (
            <CreateInviteForm
              onClose={() => setCreating(false)}
              onCreate={handleCreate}
            />
          )}

          {data?.length === 0 && !creating ? (
            <div className="flex flex-col items-center justify-center py-24 text-white/25 gap-3">
              <Link size={32} className="opacity-40" />
              <p className="text-sm">No invite links yet</p>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="text-xs text-discord-blue hover:underline"
              >
                Create your first invite
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_9rem_7rem_auto] gap-4 px-4 pb-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25">Link</p>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25">Uses</p>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25">Max</p>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25">Actions</p>
              </div>

              {data?.map((inv) => (
                <InviteRow key={inv.code} invite={inv} onDelete={handleDelete} />
              ))}

            </>
          )}
        </div>

      </div>
    </phantom-ui>
  )
}
