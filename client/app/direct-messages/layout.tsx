import { MessageSquare, Users } from "lucide-react"
import Link from "next/link"
import { ReactNode } from "react"

const mockConversations = [
  { id: "1", name: "Alice", avatar: null, online: true },
  { id: "2", name: "Bob", avatar: null, online: false },
  { id: "3", name: "Charlie", avatar: null, online: true },
]

export default function DirectMessagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full min-h-screen max-h-screen overflow-hidden">
      <aside className="flex flex-col w-60 min-w-60 bg-sidebar-primary overflow-hidden">
        <div className="p-3 border-b border-white/5">
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

          {mockConversations.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-surface-hover text-zinc-400 hover:text-zinc-100 cursor-pointer transition-colors group"
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-discord-brand/60 flex items-center justify-center text-sm font-semibold text-white">
                  {c.name.charAt(0)}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar-primary ${c.online ? "bg-green-500" : "bg-zinc-500"}`}
                />
              </div>
              <span className="text-sm truncate">{c.name}</span>
              <button className="ml-auto opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-200 transition-opacity">
                <MessageSquare size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
