import { auth } from "@clerk/nextjs/server";
import ServerSidebar from "@/components/sidebar/server/ServerSidebar"
import ServerSidebarWrapper from "@/components/sidebar/server/ServerSidebarWrapper"
import { isUserJoin } from "@/lib/queries/members"
import { redirect } from "next/navigation"
import { ReactNode } from "react"

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode,
  params: Promise<{ id: string }>
}) {
  await auth.protect();
  const { id } = await params

  const isJoin = await isUserJoin(id)
  if (!isJoin) redirect("/direct-messages")

  return (
    <div className="flex flex-col min-h-dvh bg-sidebar-secondary p-0 max-h-dvh w-full border rounded-2xl border-sidebar-secondary/10 overflow-hidden">
      <div className="flex flex-1 overflow-hidden relative">
        <ServerSidebarWrapper>
          <ServerSidebar serverId={id} />
        </ServerSidebarWrapper>
        {children}
      </div>
    </div>
  )
}
