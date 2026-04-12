
import { format } from "date-fns"
import Image from "next/image"
import { memo, useEffect, useState } from "react"
import { Reply } from "lucide-react"

import MessageMenu from "./MessageMenu"
import type { Message } from "@/lib/types/chat"

type ChatItemProps = {
  message: Message
  serverId: string
  handleDelete?: (id: string) => void
}

type ReplyThreadProps = {
  parent_content: string | null
  parent_msg_id: string | null
  parent_username: string | null
}

function ReplyThread({
  parent_content,
  parent_msg_id,
  parent_username,
}: ReplyThreadProps) {
  if (!parent_content || !parent_msg_id || !parent_username) return null
  return (
    <a
      href={`#${parent_msg_id}`}
      className="flex items-center gap-3 hover:underline"
    >
      <span className="size-5 bg-sidebar-primary/50 flex items-center justify-center rounded-full ml-5">
        <Reply size={12} className="text-white" />
      </span>
      <span className="text-green-500 font-medium text-xs hover:underline">
        {parent_username}
      </span>
      <span className="text-white/70 text-xs font-medium truncate max-w-xs">
        {parent_content}
      </span>
    </a>
  )
}

type MessageContentProps = {
  message: Pick<Message, "image_url" | "content">
}

function MessageContent({ message }: MessageContentProps) {
  const hasImageOnly = message.image_url && message.content === ""
  const hasImageWithText = message.image_url && message.content !== ""

  if (hasImageOnly) {
    return (
      <Image
        className="rounded aspect-contain"
        src={message.image_url}
        width={300}
        height={300}
        alt="attachment"
        loading="lazy"
      />
    )
  }
  if (hasImageWithText) {
    return (
      <div>
        <Image
          className="rounded aspect-contain"
          src={message.image_url}
          width={300}
          height={300}
          alt="attachment"
          loading="lazy"
        />
        <p className="text-sm text-gray-300 wrap-break-word">
          {message.content}
        </p>
      </div>
    )
  }
  return (
    <p className="text-sm text-gray-300 wrap-break-word">{message.content}</p>
  )
}

type MessageHeaderProps = {
  username: string
  isBot: boolean
  created_at: string
}

function MessageHeader({ username, isBot, created_at }: MessageHeaderProps) {
  const [formattedTime, setFormattedTime] = useState("")

  useEffect(() => {
    setFormattedTime(format(created_at, "hh:mm a"))
  }, [created_at])

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-white hover:underline cursor-pointer">
        {username}
      </span>
      {isBot && (
        <span className="text-[10px] bg-indigo-500 text-white px-1 rounded font-medium">
          BOT
        </span>
      )}
      <span className="text-[11px] text-gray-400">{formattedTime}</span>
    </div>
  )
}

function ChatItem({ message, serverId, handleDelete }: ChatItemProps) {
  return (
    <div
      id={message.id}
      data-chat-item
      className="hover:bg-white/5 group transition-colors px-4 py-1 relative"
    >
      <ReplyThread
        parent_content={message.parent_content}
        parent_msg_id={message.parent_msg_id}
        parent_username={message.parent_username}
      />
      <div className="flex items-start gap-3">
        <Image
          src={message.avatar}
          alt={message.username}
          width={40}
          height={40}
          className="rounded-full mt-0.5 shrink-0"
          loading="lazy"
        />
        <div className="flex flex-col min-w-0 flex-1">
          <MessageHeader
            username={message.username}
            isBot={false}
            created_at={message.created_at}
          />
          <MessageContent message={message} />
        </div>
        <MessageMenu
          onDelete={handleDelete ?? (() => { })}
          message={message}
          serverId={serverId}
        />
      </div>
    </div>
  )
}

export default memo(ChatItem)
