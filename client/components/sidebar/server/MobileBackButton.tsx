"use client"

import { ChevronLeft } from "lucide-react"
import { useAppStore } from "@/stores/store"

export default function MobileBackButton() {
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen)
  const setChannelSidebarOpen = useAppStore((state) => state.setChannelSidebarOpen)

  return (
    <button
      onClick={() => {
        setChannelSidebarOpen(false)
        setSidebarOpen(true)
      }}
      aria-label="Back to server list"
      className="flex items-center justify-center size-8 -ml-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 md:hidden cursor-pointer"
    >
      <ChevronLeft size={18} />
    </button>
  )
}
