import ServerSidebar from "@/components/sidebar/server/ServerSidebar"
import { ReactNode } from "react"

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode,
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex flex-col min-h-screen bg-sidebar-secondary p-0 max-h-screen w-full border rounded-2xl border-sidebar-secondary/10">
      <div className="flex flex-1 overflow-hidden">
        <ServerSidebar serverId={id} />
        {children}
      </div>
    </div>
  )
}
