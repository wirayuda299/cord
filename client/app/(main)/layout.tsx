import Sidebar from "@/components/sidebar/MainSidebar"
import type { ReactNode } from "react"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className=" flex min-h-screen bg-sidebar-secondary p-0 max-h-screen w-full border rounded-2xl border-sidebar-secondary/10">
        {children}
      </div>
    </div>)
}
