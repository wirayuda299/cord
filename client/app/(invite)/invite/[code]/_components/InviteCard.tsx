'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Users, Circle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type InviteInfo = {
  code: string
  server: {
    id: string
    name: string
    icon: string | null
    banner_color: string
    total_members: number
    online_members: number
  }
  inviter: {
    username: string
    avatar: string | null
  } | null
  uses: number
  max_users: number
  expired: boolean
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function ServerAvatar({ name, icon, color }: { name: string; icon: string | null; color: string }) {
  if (icon) {
    return (
      <img
        src={icon}
        alt={name}
        className="size-24 rounded-[2rem] object-cover border-4 border-bg-input shadow-2xl"
      />
    )
  }
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
  return (
    <div
      className="size-24 rounded-[2rem] flex items-center justify-center text-3xl font-bold text-text-bright border-4 border-bg-input shadow-2xl select-none"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  )
}

// ─── card ─────────────────────────────────────────────────────────────────────

export default function InviteCard({ info }: { info: InviteInfo }) {
  const router = useRouter()
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)

  const full = info.uses >= info.max_users
  const usagePct = Math.min((info.uses / info.max_users) * 100, 100)

  const handleJoin = async () => {
    setJoining(true)
    // TODO: call joinServer(info.code) server action
    await new Promise((r) => setTimeout(r, 1200))
    setJoined(true)
    setTimeout(() => router.push(`/${info.server.id}`), 800)
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">

      {/* Server avatar + online dot */}
      <div className="relative">
        <ServerAvatar name={info.server.name} icon={info.server.icon} color={info.server.banner_color} />
        <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-bg-input border-2 border-bg-input">
          <span className="size-3 rounded-full bg-green-500" />
        </span>
      </div>

      {/* Inviter */}
      {info.inviter && (
        <p className="text-xs text-text-muted -mt-2">
          <span className="text-text-dim font-medium">{info.inviter.username}</span> invited you to join
        </p>
      )}

      {/* Server name */}
      <h1 className="text-2xl font-bold text-text-bright tracking-tight text-center">
        {info.server.name}
      </h1>

      {/* Member counts */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <Circle size={8} className="fill-green-500 text-green-500" />
          <span className="text-xs text-text-dim">
            <span className="text-text-primary font-medium">{formatCount(info.server.online_members)}</span> Online
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Circle size={8} className="fill-text-muted text-text-muted" />
          <span className="text-xs text-text-dim">
            <span className="text-text-primary font-medium">{formatCount(info.server.total_members)}</span> Members
          </span>
        </div>
      </div>

      <div className="w-full h-px bg-surface-hover" />

      {/* Usage bar */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Users size={11} />
            Invite uses
          </div>
          <span className={cn(
            "font-medium tabular-nums",
            full ? "text-destructive" : "text-text-dim"
          )}>
            {info.uses} / {info.max_users}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface-hover overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              full ? "bg-destructive" : usagePct > 75 ? "bg-yellow-500" : "bg-discord-brand"
            )}
            style={{ width: `${usagePct}%` }}
          />
        </div>
        {full && (
          <p className="text-xs text-destructive text-center">This invite has reached its maximum uses.</p>
        )}
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-2 mt-1">
        <button
          type="button"
          onClick={handleJoin}
          disabled={joining || full}
          className={cn(
            "w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
            joined
              ? "bg-green-600 text-text-bright"
              : full
              ? "bg-surface-hover text-text-muted cursor-not-allowed"
              : "bg-discord-brand hover:bg-accent-blue text-text-bright disabled:opacity-60"
          )}
        >
          {joining && !joined && <Loader2 size={15} className="animate-spin" />}
          {joined ? "Joined! Redirecting…" : full ? "Invite Full" : "Accept Invite"}
        </button>

        <a
          href="/"
          className="w-full py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text-dim transition-colors text-center"
        >
          No thanks
        </a>
      </div>
    </div>
  )
}
