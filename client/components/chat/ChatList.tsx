"use client";

import type { Channel } from "@/lib/types/channel";
import type { Message, ResponseMessage } from "@/lib/types/chat";
import { useAppStore } from "@/stores/store";
import { Hash, UserRound } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import ChatItem from "./ChatItem";
import ChatForm from "./ChatForm";
import { TEMP_USR } from "@/lib/utils";
import MemberList from "@/components/members/MemberList";
import ReplyBar from "./ReplyBar";
import ThreadPanel from "./threads/ThreadPanel";
import { useThread } from "./threads/useThread";

type Props = {
  channel: Channel;
  serverId: string;
  historyMessages: Message[];
  variant?: "server" | "dm";
  recipient?: {
    username: string;
    avatar_url: string;
  };
};

function ChannelHeader({
  channel,
  variant = "server",
  recipient,
}: {
  channel: Channel;
  variant?: "server" | "dm";
  recipient?: Props["recipient"];
}) {
  const isDirectMessage =
    variant === "dm" ||
    channel.channel_type === "dm" ||
    channel.channel_type === "group_dm";
  const displayName = recipient?.username || channel.name || "Direct Message";

  if (isDirectMessage) {
    return (
      <div className="p-5 space-y-2">
        <div className="size-20 bg-sidebar-secondary flex items-center justify-center rounded-full overflow-hidden">
          {recipient?.avatar_url ? (
            <Image
              src={recipient.avatar_url}
              width={80}
              height={80}
              alt={displayName}
              className="size-full rounded-full object-cover"
            />
          ) : (
            <UserRound size={46} className="text-gray-400" />
          )}
        </div>
        <h2 className="text-3xl text-white font-bold">{displayName}</h2>
        <p className="text-sm text-gray-400">
          This is the beginning of your direct message with {displayName}.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-2">
      <div className="size-20 bg-sidebar-secondary flex items-center justify-center rounded-full">
        <Hash size={50} className="text-gray-400" />
      </div>
      <h2 className="text-3xl text-white font-bold">
        Welcome to {channel.name} Channel
      </h2>
      {channel.topic && <p className="text-sm text-gray-400">{channel.topic}</p>}
    </div>
  );
}

function appendUniqueMessages(
  currentMessages: Message[],
  incomingMessages: Message[],
) {
  const seen = new Set(currentMessages.map((message) => message.id));
  const next = [...currentMessages];

  for (const message of incomingMessages) {
    if (seen.has(message.id)) continue;
    seen.add(message.id);
    next.push(message);
  }

  return next;
}

export default function ChatList({
  serverId,
  channel,
  historyMessages = [],
  variant = "server",
  recipient,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(historyMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { threadState, openThread, closeThread } = useThread();
  const isDirectMessage =
    variant === "dm" ||
    channel.channel_type === "dm" ||
    channel.channel_type === "group_dm";
  const displayName = recipient?.username || channel.name || "Direct Message";

  const { selectedMsg, setSelectedMsg, isMemberOpen } = useAppStore(
    useShallow((s) => ({
      selectedMsg: s.selectedMsg,
      setSelectedMsg: s.setSelectedMsg,
      isMemberOpen: s.isMemberOpen,
    })),
  );

  useEffect(() => {
    if (!bottomRef) return;

    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleMessages = useCallback((msg: ResponseMessage) => {
    setMessages((prev) => appendUniqueMessages(prev, msg.messages));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleEdit = useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content, updated_at: new Date().toISOString() } : m)),
    );
  }, []);

  const handleToggleReaction = useCallback((id: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const reactions = m.reactions ?? [];
        const hasReacted = reactions.some(
          (r) => r.user_id === TEMP_USR && r.emoji === emoji,
        );
        if (hasReacted) {
          return {
            ...m,
            reactions: reactions.filter(
              (r) => !(r.user_id === TEMP_USR && r.emoji === emoji),
            ),
          };
        }
        return {
          ...m,
          reactions: [...reactions, { user_id: TEMP_USR, emoji }],
        };
      }),
    );
  }, []);

  const handleCreateThread = useCallback(
    (message: Message) => {
      openThread(message);
    },
    [openThread],
  );

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0">
          <ChannelHeader
            channel={channel}
            variant={variant}
            recipient={recipient}
          />
          <div className="flex flex-col gap-5 pb-4">
            {messages.map((m) => (
              <ChatItem
                variant="channel"
                key={m.id}
                message={m}
                serverId={serverId}
                handleDelete={handleDelete}
                onEdit={handleEdit}
                onToggleReaction={handleToggleReaction}
                onCreateThread={
                  isDirectMessage ? undefined : handleCreateThread
                }
              />
            ))}
          </div>
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0">
          {selectedMsg && (
            <ReplyBar
              message={selectedMsg}
              onCancel={() => setSelectedMsg(null)}
            />
          )}
          <ChatForm
            userId={TEMP_USR}
            channelName={displayName}
            channelId={channel.id}
            serverId={serverId}
            placeholder={
              isDirectMessage
                ? `Message @${displayName}`
                : `Message #${channel.name}`
            }
            handleMessages={handleMessages}
            handleDelete={handleDelete}
          />
        </div>
      </div>

      {!isDirectMessage && <MemberList isOpen={isMemberOpen} />}
      {!isDirectMessage && (
        <ThreadPanel
          onSendReply={(e) => {
            console.log("Message -> ", e);
          }}
          parentMessage={threadState.parentMessage}
          threadMessages={threadState.threadMessages}
          isOpen={threadState.isOpen}
          onClose={closeThread}
          onDeleteMessage={handleDelete}
          serverId={serverId}
        />
      )}
    </div>
  );
}
