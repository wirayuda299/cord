import { auth } from "@clerk/nextjs/server";
import Sidebar from "@/components/sidebar/MainSidebar"
import SidebarWrapper from "@/components/sidebar/SidebarWrapper"
import type { ReactNode } from "react"

export default async function RootLayout({ children }: { children: ReactNode }) {
  await auth.protect();
  return (
    <div className="flex min-h-screen max-h-screen w-full overflow-hidden">
      <SidebarWrapper>
        <Sidebar />
      </SidebarWrapper>
      <div className="flex-1 flex min-h-screen bg-sidebar-secondary p-0 max-h-screen w-full border md:rounded-2xl border-sidebar-secondary/10 overflow-hidden">
        {children}
      </div>
    </div>)
}
