import ServerSidebar from "@/components/sidebar/server/ServerSidebar"
import { isUserJoin } from "@/lib/server/data/members"
import { redirect } from "next/navigation"
import { ReactNode } from "react"

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode,
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const isJoin = await isUserJoin(id)
  if (!isJoin) redirect("/direct-messages")

  return (
    <div className="flex flex-col min-h-screen bg-sidebar-secondary p-0 max-h-screen w-full border rounded-2xl border-sidebar-secondary/10">
      <div className="flex flex-1 overflow-hidden">
        <ServerSidebar serverId={id} />
        {children}
      </div>
    </div>
  )
}
