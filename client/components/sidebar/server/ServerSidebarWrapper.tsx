"use client"

import { useAppStore } from "@/stores/store"
import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function ServerSidebarWrapper({ children }: { children: React.ReactNode }) {
  const isChannelSidebarOpen = useAppStore((state) => state.isChannelSidebarOpen)
  const setChannelSidebarOpen = useAppStore((state) => state.setChannelSidebarOpen)
  const pathname = usePathname()

  useEffect(() => {
    setChannelSidebarOpen(false)
  }, [pathname, setChannelSidebarOpen])

  return (
    <>
      {isChannelSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-all duration-300"
          onClick={() => setChannelSidebarOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-20 z-40 w-64 transform  transition-transform duration-300 ease-in-out md:static md:translate-x-0 shrink-0",
          isChannelSidebarOpen ? "left-0" : "-left-full"
        )}
      >
        {children}
      </div>
    </>
  )
}
