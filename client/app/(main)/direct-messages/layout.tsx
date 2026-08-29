import { auth } from "@clerk/nextjs/server";
import { ReactNode } from "react"

import { getAllConversations } from "@/lib/queries/conversations"
import ConversationListDrawer from "@/components/direct-messages/ConversationListDrawer"


export default async function DirectMessagesLayout({ children }: { children: ReactNode }) {
  await auth.protect();
  const conversations = await getAllConversations()

  return (
    <div className="flex w-full min-h-dvh max-h-dvh overflow-hidden">
      <ConversationListDrawer conversations={conversations} />
      <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
    </div>
  )
}
