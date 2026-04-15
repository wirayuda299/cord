'use client'

import {
  Settings, LayoutDashboard, Shield, Users, Link2,
  Zap, ShieldCheck, ScrollText, Ban, Trash2, X,
} from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { memo, useState } from "react"
import { cn } from "@/lib/utils"
import ServerProfile from "./profile"
import BoostPerks from "./BoostPerks"
import Members from "./Members"
import ServerRolesSettings from "./roles"
import Invites from "./Invites"
import SafetySetup from "./SafetySetup"
import AuditLog from "./AuditLog"
import Bans from "./Bans"
import { useParams, useSearchParams } from "next/navigation"


type SidebarItem = {
  id: string
  label: string
  icon: React.ReactNode
  danger?: boolean
}

type SidebarGroup = {
  title?: string
  items: SidebarItem[]
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    title: "Server Settings",
    items: [
      { id: "server profile", label: "Overview", icon: <LayoutDashboard size={15} /> },
      { id: "roles", label: "Roles", icon: <Shield size={15} /> },
    ],
  },
  {
    title: "Community",
    items: [
      { id: "members", label: "Members", icon: <Users size={15} /> },
      { id: "invites", label: "Invites", icon: <Link2 size={15} /> },
      { id: "boost perks", label: "Boost Perks", icon: <Zap size={15} /> },
    ],
  },
  {
    title: "Moderation",
    items: [
      { id: "safety setup", label: "Safety Setup", icon: <ShieldCheck size={15} /> },
      { id: "audit log", label: "Audit Log", icon: <ScrollText size={15} /> },
      { id: "bans", label: "Bans", icon: <Ban size={15} /> },
    ],
  },
  {
    items: [
      { id: "delete server", label: "Delete Server", icon: <Trash2 size={15} />, danger: true },
    ],
  },
]



function NavItem({
  item,
  active,
  onClick,
}: {
  item: SidebarItem
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left relative group",
        item.danger
          ? active
            ? "bg-destructive/15 text-destructive"
            : "text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
          : active
            ? "bg-surface-hover text-text-bright"
            : "text-text-dim hover:bg-surface-subtle/50 hover:text-text-primary",
      )}
    >
      {active && !item.danger && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-discord-brand" />
      )}
      <span className={cn(
        "shrink-0 transition-colors",
        item.danger
          ? "text-destructive/70 group-hover:text-destructive"
          : active ? "text-discord-brand" : "text-text-muted group-hover:text-text-dim",
      )}>
        {item.icon}
      </span>
      {item.label}
    </button>
  )
}


function SettingsSidebar({
  serverName,
  active,
  onSelect,
}: {
  serverName: string
  active: string
  onSelect: (id: string) => void
}) {
  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen bg-surface-chat border-r border-surface-subtle/40">

      <div className="px-4 pt-5 pb-3 shrink-0">
        <p className="text-sm font-semibold text-text-primary truncate">{serverName}</p>
        <p className="text-xs text-text-muted mt-px">Server Settings</p>
      </div>

      <div className="h-px bg-surface-subtle/40 mx-3" />

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {SIDEBAR_GROUPS.map((group, gi) => (
          <div key={gi}>
            {!group.title && gi > 0 && (
              <div className="h-px bg-surface-subtle/40 mx-1 mb-4" />
            )}

            {group.title && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                {group.title}
              </p>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  active={active === item.id}
                  onClick={() => onSelect(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User hint at bottom */}
      <div className="shrink-0 px-3 py-3 border-t border-surface-subtle/40">
        <p className="text-[10px] text-text-muted leading-relaxed">
          Esc or click outside to close
        </p>
      </div>
    </aside>
  )
}


function ServerSettingDialog({ serverId }: { serverId: string }) {
  const [active, setActive] = useState("server profile")
  const sp = useSearchParams()
  const serverName = sp.get("name") ?? "Server"

  return (
    <Dialog>
      <DialogTrigger className="w-full p-1.5 text-sm rounded flex justify-between items-center hover:bg-sidebar-primary/15 text-white hover:text-white transition-colors">
        <p>Server Settings</p>
        <Settings size={16} />
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        onKeyDown={(e) => e.stopPropagation()}
        className="min-w-full min-h-screen rounded-none bg-surface-base p-0 border-none ring-0"
      >
        <div className="flex h-screen">
          <SettingsSidebar
            serverName={serverName}
            active={active}
            onSelect={setActive}
          />

          <main className="flex-1 relative overflow-hidden">
            <DialogClose className="absolute top-4 right-4 z-10 flex items-center justify-center size-8 rounded-lg bg-surface-hover hover:bg-surface-subtle text-text-dim hover:text-text-bright transition-colors">
              <X size={15} />
              <span className="sr-only">Close</span>
            </DialogClose>

            {active === "server profile" && <ServerProfile />}
            {active === "boost perks" && <BoostPerks />}
            {active === "members" && <Members />}
            {active === "roles" && <ServerRolesSettings />}
            {active === "invites" && <Invites serverID={serverId} />}
            {active === "safety setup" && <SafetySetup />}
            {active === "audit log" && <AuditLog />}
            {active === "bans" && <Bans />}
            {active === "delete server" && (
              <div className="flex items-center justify-center h-full text-text-muted">
                <p className="text-sm">Delete server panel</p>
              </div>
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  )
}
export default memo(ServerSettingDialog)
