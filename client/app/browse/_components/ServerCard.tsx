'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { joinServer } from '@/lib/server/actions/servers'
import type { BrowsableServer } from '@/lib/types/server'

const PALETTE = [
  '#5865f2', '#3ba55d', '#faa61a', '#ed4245', '#9c84ef',
  '#eb459e', '#57f287', '#7289da', '#4752c4', '#3ba55d',
]

function accentColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return PALETTE[Math.abs(h) % PALETTE.length]
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

export default function ServerCard({ server }: { server: BrowsableServer }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [joined, setJoined] = useState(false)
  const color = accentColor(server.name)

  const handleJoin = () => {
    startTransition(async () => {
      const res = await joinServer(server.id, 'usr_001')
      if (res?.error) {
        alert(res.error)
        return
      }
      setJoined(true)
      router.push(`/${server.id}?name=${server.name}`)
    })
  }

  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl bg-surface-raised hover:bg-surface-overlay transition-colors">
      <div
        className="h-16 w-full"
        style={{ background: `linear-gradient(135deg, ${color}55 0%, ${color}11 100%)` }}
      />

      <div className="absolute top-8 left-4">
        {server.logo ? (
          <Image
            src={server.logo}
            width={52}
            height={52}
            alt={server.name}
            className="size-13 rounded-xl object-cover border-4 border-surface-raised"
          />
        ) : (
          <div
            className="size-13 rounded-xl flex items-center justify-center text-lg font-bold text-white border-4 border-surface-raised select-none"
            style={{ backgroundColor: color }}
          >
            {initials(server.name)}
          </div>
        )}
      </div>

      <div className="pt-8 px-4 pb-4 flex flex-col gap-2.5">
        <h3 className="font-semibold text-text-bright capitalize truncate">{server.name}</h3>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Users size={11} />
          <span>{server.member_count.toLocaleString()} members</span>
        </div>

        <button
          type="button"
          onClick={handleJoin}
          disabled={isPending || joined}
          className={cn(
            'mt-1 w-full py-2 rounded-lg text-sm font-semibold transition-all',
            joined
              ? 'bg-green-600/20 text-green-400 cursor-default'
              : 'bg-discord-brand hover:bg-accent-blue text-white disabled:opacity-60 disabled:cursor-not-allowed'
          )}
        >
          {joined ? 'Joined!' : isPending ? 'Joining…' : 'Join'}
        </button>
      </div>
    </div>
  )
}
