"use client"

import PendingRequests from "@/components/friends/PendingRequests"
import { Users, UserCheck, Clock, UserPlus } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

type Tab = "online" | "all" | "pending" | "add"

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "online", label: "Online", icon: <Users size={16} /> },
  { id: "all", label: "All", icon: <UserCheck size={16} /> },
  { id: "pending", label: "Pending", icon: <Clock size={16} /> },
  { id: "add", label: "Add Friend", icon: <UserPlus size={16} /> },
]

const mockOnline = [
  { id: "1", name: "zara_dev", tag: "#2201", activity: "Playing Minecraft" },
  { id: "2", name: "theo.js", tag: "#9900", activity: "Coding in VS Code" },
]
const mockAll = [
  ...mockOnline,
  { id: "3", name: "luna_m", tag: "#0077", activity: null },
  { id: "4", name: "brecht", tag: "#5512", activity: null },
]

function FriendRow({ name, tag, activity, online }: { name: string; tag: string; activity: string | null; online?: boolean }) {
  return (
    <li className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-surface-hover group transition-colors cursor-pointer">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-discord-brand/70 flex items-center justify-center text-sm font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
          {online !== undefined && (
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar-secondary",
                online ? "bg-green-500" : "bg-zinc-500"
              )}
            />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100 truncate">{name}</p>
          <p className="text-xs text-zinc-500 truncate">{activity ?? (online ? "Online" : "Offline")}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-raised hover:bg-surface-hover text-zinc-400 hover:text-zinc-200 transition-colors">
          <Users size={15} />
        </button>
      </div>
    </li>
  )
}

function AddFriendPanel() {
  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <div>
        <h3 className="text-base font-semibold text-text-bright">Add Friend</h3>
        <p className="text-sm text-zinc-500 mt-0.5">You can add friends with their username.</p>
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-bg-input border border-white/5 focus-within:border-discord-brand transition-colors">
        <input
          type="text"
          placeholder="Enter a username#0000"
          className="flex-1 bg-transparent outline-none text-sm text-zinc-200 placeholder:text-zinc-600"
        />
        <button className="px-3 py-1.5 rounded-md bg-discord-brand hover:bg-accent-blue text-white text-xs font-semibold transition-colors">
          Send Friend Request
        </button>
      </div>
    </div>
  )
}

export default function DirectMessagesPage() {
  const [tab, setTab] = useState<Tab>("pending")

  return (
    <div className="flex flex-col w-full min-h-screen bg-sidebar-secondary">
      <header className="flex items-center gap-4 px-4 h-12 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2 text-zinc-200">
          <Users size={18} className="text-zinc-400" />
          <span className="text-sm font-semibold">Friends</span>
        </div>
        <div className="w-px h-5 bg-white/10" />
        <nav className="flex items-center gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md text-sm transition-colors",
                t.id === "add"
                  ? tab === "add"
                    ? "bg-green-500/20 text-green-400 font-medium"
                    : "text-green-400 hover:bg-green-500/10 font-medium"
                  : tab === t.id
                  ? "bg-surface-hover text-zinc-100 font-medium"
                  : "text-zinc-400 hover:bg-surface-hover hover:text-zinc-200"
              )}
            >
              {t.id === "add" && t.icon}
              {t.label}
              {t.id === "pending" && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                  2
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === "pending" && <PendingRequests />}

        {tab === "online" && (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              Online — {mockOnline.length}
            </p>
            <ul className="space-y-1">
              {mockOnline.map((f) => (
                <FriendRow key={f.id} {...f} online={true} />
              ))}
            </ul>
          </>
        )}

        {tab === "all" && (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              All Friends — {mockAll.length}
            </p>
            <ul className="space-y-1">
              {mockAll.map((f, i) => (
                <FriendRow key={f.id} {...f} online={i < 2} />
              ))}
            </ul>
          </>
        )}

        {tab === "add" && <AddFriendPanel />}
      </div>
    </div>
  )
}
