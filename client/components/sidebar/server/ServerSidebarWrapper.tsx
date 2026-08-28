"use client"

import { useAppStore } from "@/stores/store"
import { cn } from "@/lib/utils"

export default function ServerSidebarWrapper({ children }: { children: React.ReactNode }) {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen)

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-20 z-40 w-64 transform  transition-transform duration-300 ease-in-out md:static md:translate-x-0 shrink-0",
        isSidebarOpen ? "left-0" : "-left-full"
      )}
    >
      {children}
    </div>
  )
}
