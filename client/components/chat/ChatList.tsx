"use client"

import type { Channel } from "@/lib/types/channel"
import type { Message, ResponseMessage } from "@/lib/types/chat"
import { useAppStore } from "@/stores/store"
import { Hash } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import ChatItem from "./ChatItem"
import ChatForm from "./ChatForm"
import MemberList from "@/components/members/MemberList"
import ReplyBar from "./ReplyBar"

const HEADER_HEIGHT = 140

type Props = {
  channel: Channel
  serverId: string
  historyMessages: Message[]
}

function ChannelHeader({ channel }: { channel: Channel }) {
  return (
    <div className="mb-10 p-5 space-y-2" style={{ height: HEADER_HEIGHT }}>
      <div className="size-20 bg-sidebar-secondary flex items-center justify-center rounded-full">
        <Hash size={50} className="text-gray-400" />
      </div>
      <h2 className="text-3xl text-white font-bold">
        Welcome to {channel.name} Channel
      </h2>
      {channel.topic && (
        <p className="text-sm text-gray-400">{channel.topic}</p>
      )}
    </div>
  )
}

export default function ChatList({
  serverId,
  channel,
  historyMessages = [],
}: Props) {
  const [messages, setMessages] = useState<Message[]>(historyMessages ?? [])

  const formRef = useRef<HTMLDivElement>(null)

  const { selectedMsg, setSelectedMsg, isOpen } = useAppStore(
    useShallow((state) => ({
      selectedMsg: state.selectedMsg,
      setSelectedMsg: state.setSelectedMsg,
      isOpen: state.isMemberOpen,
    })),
  )

  const handleMessages = useCallback((msg: ResponseMessage) => {
    setMessages((prev) => [...(prev ?? []), ...msg.messages])
  }, [])

  const handleDelete = useCallback((id: string) => {
    setMessages((prev) => (prev ?? []).filter((m) => m.id !== id))
  }, [])

  return (
    <div className="flex h-screen ">
      <div
        className={cn("flex-1 ", messages.length > 0 ? "overflow-y-auto" : "overflow-hidden")}
      >
        <ChannelHeader channel={channel} />

        <ScrollArea>
          <div className="flex flex-col gap-5 min-h-screen pb-20">
            {(messages?.length ?? 0) > 0 &&
              messages.map((m) => (
                <ChatItem
                  message={m}
                  serverId={serverId}
                  handleDelete={handleDelete}
                  key={m.id}
                />
              ))}
          </div>
        </ScrollArea>
        <div
          ref={formRef}
          className={cn(
            "w-full ",
            messages ? "sticky bottom-18" : " mt-auto",
          )}
        >
          {selectedMsg && (
            <ReplyBar
              message={selectedMsg}
              onCancel={() => setSelectedMsg(null)}
            />
          )}
          <ChatForm
            channelName={channel.name}
            channelId={channel.channel_id}
            serverId={serverId}
            handleMessages={handleMessages}
            handleDelete={handleDelete}
            parentMsgId={selectedMsg?.id ?? null}
            setSelectedMsg={setSelectedMsg}
          />
        </div>
      </div>

      <MemberList isOpen={isOpen} />
    </div>
  )
}
