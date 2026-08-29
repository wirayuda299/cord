"use client"

import { Menu, ShieldAlert, Compass } from "lucide-react"
import { useAppStore } from "@/stores/store"

type ServerDetailHeaderProps = {
  serverName: string
}

export default function ServerDetailHeader({ serverName }: ServerDetailHeaderProps) {
  const setChannelSidebarOpen = useAppStore((state) => state.setChannelSidebarOpen)

  return (
    <header className="h-14 shrink-0 px-4 bg-surface-chat/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3 h-full">
        <button
          onClick={() => setChannelSidebarOpen(true)}
          aria-label="Open channel list"
          className="flex items-center justify-center size-8 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 md:hidden cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Compass size={18} className="text-discord-blue" />
          <h1 className="text-sm font-semibold text-white capitalize truncate max-w-40 sm:max-w-64">
            {serverName} Overview
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-white/40">
        <ShieldAlert size={14} className="text-white/30" />
        <span className="hidden sm:inline">Server Dashboard</span>
      </div>
    </header>
  )
}
