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
    <div className=" flex min-h-screen bg-sidebar-secondary p-0 max-h-screen w-full border rounded-2xl border-sidebar-secondary/10">
      <ServerSidebar serverId={id} />
      {children}
    </div>
  )
}
