"use client"

import { ChevronDown, Hash, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/store"
import { GroupedChannels } from "@/lib/server/data/channels"
import { useParams } from "next/navigation"
import Link from "next/link"

export default function ChannelList({ channels }: { channels: GroupedChannels }) {
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
                <li key={c.id} className="pl-5 first:pt-2 text-sm">
                  <Link
                    href={`/${param.id}/${c.id}?name=${channels.server.name}`}
                    className="flex items-center gap-2 text-gray-400 hover:text-white"
                  >
                    {c.channel_type === 'text' ? <Hash size={15} /> : <Volume2 size={15} />}
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}
