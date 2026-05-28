'use client'

import { Channel } from "@/lib/types/channel"
import { createContext, type ReactNode } from "react"

export const ChannelContext = createContext<Promise<Channel> | null>(null)


export default function ChannelProvider({
  children,
  channelPromise
}: {
  children: ReactNode
  channelPromise: Promise<Channel>
}) {

  return <ChannelContext
    value={channelPromise}>
    {children}
  </ChannelContext>
}
