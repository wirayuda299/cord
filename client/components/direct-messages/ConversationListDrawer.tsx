"use client"

import { MessageSquare, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/store"
import MobileBackButton from "@/components/sidebar/server/MobileBackButton"
import type { Conversation } from "@/types/conversation"

export default function ConversationListDrawer({
  conversations,
}: {
  conversations: Conversation[]
}) {
  const isOpen = useAppStore((state) => state.isChannelSidebarOpen)
  const setOpen = useAppStore((state) => state.setChannelSidebarOpen)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname, setOpen])

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-all duration-300"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          "flex flex-col w-64 md:w-60 md:min-w-60 shrink-0 bg-sidebar-primary overflow-hidden",
          "fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out",
          "md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2 mb-2 md:hidden">
            <MobileBackButton />
            <span className="text-xs font-semibold text-zinc-400">Servers</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-bg-input text-sm text-zinc-400 cursor-text">
            <span className="text-xs">Find or start a conversation</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <Link
            href="/direct-messages"
            className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-surface-hover text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <Users size={18} />
            <span className="text-sm font-medium">Friends</span>
          </Link>

          <div className="pt-4 pb-1 px-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              Direct Messages
            </p>
          </div>

          {conversations.length === 0 && (
            <p className="px-2 py-2 text-xs text-zinc-500">
              No direct messages yet
            </p>
          )}

          {conversations.map((c) => (
            <Link
              key={c.channel_id}
              href={`/direct-messages/${c.channel_id}`}
              className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-surface-hover text-zinc-400 hover:text-zinc-100 cursor-pointer transition-colors group"
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-discord-brand/60 flex items-center justify-center text-sm font-semibold text-white overflow-hidden">
                  {c.other_avatar_url ? (
                    <Image
                      src={c.other_avatar_url}
                      width={32}
                      height={32}
                      alt={c.name}
                      className="size-full rounded-full object-cover"
                    />
                  ) : (
                    c.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar-primary bg-green-500" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm truncate">{c.name}</span>
                {c.last_message_content && (
                  <span className="block text-xs text-zinc-500 truncate">
                    {c.last_message_content}
                  </span>
                )}
              </div>
              <span className="ml-auto opacity-0 group-hover:opacity-100 text-zinc-500 group-hover:text-zinc-200 transition-opacity">
                <MessageSquare size={14} />
              </span>
            </Link>
          ))}
        </div>
      </aside>
    </>
  )
}
