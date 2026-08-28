"use client"

import { ChevronDown, Hash, Settings, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/store"
import { GroupedChannels } from "@/lib/queries/channels"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Dialog, DialogContent, DialogTrigger } from "../../ui/dialog"

export default function ChannelList({ channels, hasPerm }: { channels: GroupedChannels, hasPerm: boolean }) {
  const category = useAppStore(c => c.selectedCategory)
  const chooseCategory = useAppStore(c => c.setSelectedCategory)
  const param = useParams()

  return (
    <ul className="flex flex-col gap-3 text-white p-4">
      {channels.uncategorized.map((c) => (
        <li key={c.id} className="pl-2 text-sm">
          <Link
            href={`/${param.id}/${c.id}?name=${channels.server.name}`}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            {c.channel_type === 'text' ? <Hash size={15} /> : <Volume2 size={15} />}
            {c.name}
          </Link>
        </li>
      ))}

      {channels.categories.map((cat) => (
        <li key={cat.id}>
          <button
            onClick={() => chooseCategory(category?.id === cat.id ? null : cat)}
            className="text-sm flex items-center w-full py-1.5 gap-2 font-medium text-gray-400 cursor-pointer"
          >
            <ChevronDown
              size={18}
              className={cn(
                "transition-transform duration-100",
                category?.id === cat.id ? "rotate-0" : "-rotate-90"
              )}
            />
            {cat.name}
          </button>

          {category?.id === cat.id && (
            <ul className="flex flex-col gap-3">
              {cat.channels.map((c) => (
                <li key={c.id} className="px-5 py-1 transition-colors ease duration-200 group rounded-md hover:bg-surface-chat text-sm flex items-center justify-between">
                  <Link
                    href={`/${param.id}/${c.id}`}
                    className="flex items-center gap-2 text-gray-400 group-hover:text-white"
                  >
                    {c.channel_type === 'text' ? <Hash className='group-hover:text-white' size={15} /> : <Volume2 size={15} />}
                    {c.name}
                  </Link>

                  {hasPerm && (
                    <Dialog>
                      <DialogTrigger>
                        <Settings size={15} className='text-gray-400 group-hover:block hidden group-hover:text-white' />
                      </DialogTrigger>
                      <DialogContent>
                        hello world
                      </DialogContent>
                    </Dialog>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}
