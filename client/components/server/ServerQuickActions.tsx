"use client"


import { copyText } from "@/lib/client/clipboard"
import { getPublicApiUrl } from "@/lib/env"
import { Copy, Check, MessageSquare, ArrowRight, ShieldCheck, Sparkles } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

type ServerQuickActionsProps = {
  serverId: string
  firstChannelId?: string
  firstChannelName?: string
}



export default function ServerQuickActions({
  serverId,
  firstChannelId,
  firstChannelName,
}: ServerQuickActionsProps) {

  const [copied, setCopied] = useState(false)
  const uniqueLINK = `${getPublicApiUrl()}/invite/${serverId}}`

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="p-5 rounded-2xl bg-surface-chat border border-white/5 hover:border-discord-blue/40 transition-all duration-300 group flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-discord-blue/10 text-discord-blue rounded-full">
              Growth
            </span>
            <Sparkles size={16} className="text-white/20 group-hover:text-discord-blue transition-colors" />
          </div>
          <h3 className="text-sm font-semibold text-white">Invite Your Friends</h3>
          <p className="text-xs text-white/50 leading-relaxed">
            Share this server&apos;s unique link with your friends so they can join directly.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <div className="flex-1 bg-overlay/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/70 font-mono truncate select-all">
            {uniqueLINK}
          </div>
          <button
            onClick={() => copyText(uniqueLINK).then(() => {
              setCopied(true)
              setTimeout(() => {
                setCopied(false)
              }, 2000)
            })}
            className="p-2 bg-discord-blue hover:bg-discord-blue/80 text-white rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 text-xs"
            title="Copy invite link"
          >
            {copied ? (
              <>
                <Check size={14} className="text-green-300 animate-bounce" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {firstChannelId ? (
        <Link
          href={`/${serverId}/${firstChannelId}`}
          className="p-5 rounded-2xl bg-surface-chat border border-white/5 hover:border-discord-blue/40 transition-all duration-300 group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 rounded-full">
                Active
              </span>
              <MessageSquare size={16} className="text-white/20 group-hover:text-green-400 transition-colors" />
            </div>
            <h3 className="text-sm font-semibold text-white">Start Chatting</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Jump straight into the main conversation in the general text channel.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between text-xs text-white font-medium group-hover:text-discord-blue transition-colors">
            <span>Join #{firstChannelName || "general"}</span>
            <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      ) : (
        <div className="p-5 rounded-2xl bg-surface-chat border border-white/5 opacity-70 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/40 rounded-full">
                Inactive
              </span>
              <ShieldCheck size={16} className="text-white/20" />
            </div>
            <h3 className="text-sm font-semibold text-white/80">No Channels Found</h3>
            <p className="text-xs text-white/40 leading-relaxed">
              There are no channels available. Create a channel using the sidebar menu.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
