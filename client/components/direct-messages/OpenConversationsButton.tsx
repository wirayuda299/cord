"use client"

import { Menu } from "lucide-react"
import { useAppStore } from "@/stores/store"

export default function OpenConversationsButton() {
  const setOpen = useAppStore((state) => state.setChannelSidebarOpen)

  return (
    <button
      onClick={() => setOpen(true)}
      aria-label="Open conversations"
      className="flex items-center justify-center size-8 -ml-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 md:hidden cursor-pointer"
    >
      <Menu size={18} />
    </button>
  )
}
