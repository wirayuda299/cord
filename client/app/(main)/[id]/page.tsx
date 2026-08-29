import { auth } from "@clerk/nextjs/server"
import { unauthorized } from "next/navigation"
import { getAllChannel } from "@/lib/queries/channels"
import { getAllMembersInServer } from "@/lib/queries/members"
import ServerDetailHeader from "@/components/server/ServerDetailHeader"
import ServerQuickActions from "@/components/server/ServerQuickActions"
import Image from "next/image"
import Link from "next/link"
import {
  Users,
  Hash,
  Volume2,
  Folder,
  Crown,
  ArrowRight,
} from "lucide-react"

export default async function ServerDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await auth.protect();
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return unauthorized()

  const [channels, members] = await Promise.all([
    getAllChannel(id),
    getAllMembersInServer(id)
  ])

  if (!channels || !channels.server) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white/50 p-6">
        <p className="text-sm font-medium">Server not found</p>
        <Link href="/direct-messages" className="mt-4 px-4 py-2 bg-discord-blue text-white rounded-lg text-xs hover:bg-discord-blue/80 transition-colors">
          Back to Direct Messages
        </Link>
      </div>
    )
  }

  const { server } = channels
  const totalMembers = members.length

  const textChannelsCount = channels.uncategorized.filter(c => c.channel_type === 'text').length +
    channels.categories.reduce((acc, cat) => acc + cat.channels.filter(c => c.channel_type === 'text').length, 0)

  const voiceChannelsCount = channels.uncategorized.filter(c => c.channel_type === 'audio').length +
    channels.categories.reduce((acc, cat) => acc + cat.channels.filter(c => c.channel_type === 'audio').length, 0)

  const categoriesCount = channels.categories.length

  const firstTextChannel = channels.uncategorized.find(c => c.channel_type === 'text') ||
    channels.categories.flatMap(cat => cat.channels).find(c => c.channel_type === 'text')

  return (
    <div className="flex-1 bg-surface-content flex flex-col h-dvh overflow-hidden">
      <ServerDetailHeader serverName={server.name} />
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 lg:border-r lg:border-white/5">
        <div className="relative rounded-3xl overflow-hidden bg-linear-to-br from-indigo-900/40 via-surface-chat to-overlay border border-white/5 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-discord-blue/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative size-24 sm:size-28 rounded-3xl overflow-hidden bg-discord-blue/10 border border-discord-blue/20 flex items-center justify-center shadow-md shrink-0 select-none">
            {server.logo ? (
              <Image
                src={server.logo}
                alt={server.name}
                width={112}
                height={112}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-4xl font-black text-white capitalize">
                {server.name.slice(0, 1)}
              </span>
            )}
          </div>

          <div className="text-center sm:text-left space-y-2 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight capitalize truncate">
                {server.name}
              </h2>
              {server.created_by === userId && (
                <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded-full flex items-center gap-1 shrink-0 select-none">
                  <Crown size={10} className="fill-amber-400/20" /> OWNER
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-white/60 max-w-xl leading-relaxed">
              Welcome to the official hub of the <strong>{server.name}</strong> community. Explore text and audio channels or coordinate with members in real-time.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-surface-chat/30 border border-white/5 hover:bg-surface-chat/50 transition-colors duration-200">
            <div className="flex items-center justify-between text-white/40">
              <span className="text-xs font-semibold">Members</span>
              <Users size={15} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">{totalMembers}</p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-chat/30 border border-white/5 hover:bg-surface-chat/50 transition-colors duration-200">
            <div className="flex items-center justify-between text-white/40">
              <span className="text-xs font-semibold">Text channels</span>
              <Hash size={15} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">{textChannelsCount}</p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-chat/30 border border-white/5 hover:bg-surface-chat/50 transition-colors duration-200">
            <div className="flex items-center justify-between text-white/40">
              <span className="text-xs font-semibold">Audio calls</span>
              <Volume2 size={15} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">{voiceChannelsCount}</p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-chat/30 border border-white/5 hover:bg-surface-chat/50 transition-colors duration-200">
            <div className="flex items-center justify-between text-white/40">
              <span className="text-xs font-semibold">Categories</span>
              <Folder size={15} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">{categoriesCount}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Quick Actions</h3>
          <ServerQuickActions
            serverId={id}
            firstChannelId={firstTextChannel?.id}
            firstChannelName={firstTextChannel?.name}
          />
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Explore Channels</h3>
            <span className="text-[10px] font-semibold bg-white/5 text-white/40 px-2 py-0.5 rounded-full select-none">
              {textChannelsCount + voiceChannelsCount} Available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels.uncategorized.length > 0 && (
              <div className="p-4 rounded-2xl bg-surface-chat/20 border border-white/5 space-y-3">
                <h4 className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Uncategorized</h4>
                <div className="flex flex-col gap-1.5">
                  {channels.uncategorized.map((chan) => (
                    <Link
                      key={chan.id}
                      href={`/${id}/${chan.id}`}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-xs text-white/70 hover:text-white group"
                    >
                      <div className="flex items-center gap-2">
                        {chan.channel_type === 'text' ? (
                          <Hash size={13} className="text-white/30 group-hover:text-discord-blue transition-colors" />
                        ) : (
                          <Volume2 size={13} className="text-white/30 group-hover:text-green-400 transition-colors" />
                        )}
                        <span className="font-medium capitalize">{chan.name}</span>
                      </div>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0 transition-all text-white/40" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {channels.categories.map((cat) => (
              <div key={cat.id} className="p-4 rounded-2xl bg-surface-chat/20 border border-white/5 space-y-3">
                <h4 className="text-[11px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                  <Folder size={11} className="text-white/30" />
                  <span className="truncate">{cat.name}</span>
                </h4>
                <div className="flex flex-col gap-1">
                  {cat.channels.length === 0 ? (
                    <p className="text-[11px] text-white/20 italic pl-1">No channels inside this category</p>
                  ) : (
                    cat.channels.map((chan) => (
                      <Link
                        key={chan.id}
                        href={`/${id}/${chan.id}`}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-xs text-white/70 hover:text-white group"
                      >
                        <div className="flex items-center gap-2">
                          {chan.channel_type === 'text' ? (
                            <Hash size={13} className="text-white/30 group-hover:text-discord-blue transition-colors" />
                          ) : (
                            <Volume2 size={13} className="text-white/30 group-hover:text-green-400 transition-colors" />
                          )}
                          <span className="font-medium capitalize">{chan.name}</span>
                        </div>
                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0 transition-all text-white/40" />
                      </Link>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
