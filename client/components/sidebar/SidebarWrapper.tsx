"use client"

import { useAppStore } from "@/stores/store"
import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen)
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen)
  const pathname = usePathname()

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname, setSidebarOpen])

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 -left-full z-40 w-20 transition-all duration-300 ease md:static shrink-0",
          isSidebarOpen ? "left-0" : "-left-full"
        )}
      >
        {children}
      </div>
    </>
  )
}
