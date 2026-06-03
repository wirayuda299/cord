"use client";

import type { Message, ResponseMessage } from "@/lib/types/chat";
import { useAppStore } from "@/stores/store";
import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import ChatItem from "./ChatItem";
import ChatForm from "./ChatForm";
import MemberList from "@/components/members/MemberList";
import ReplyBar from "./ReplyBar";
import { useWebSocket } from "@/hooks/useWebsocket";
import { MessageSquareText } from "lucide-react";

type Props = {
  channel: {
    id: string
    channel_type: string
    name: string
    topic: string
  }
  thread_id?: string | null
  serverId: string;
  historyMessages: Message[];
  variant?: "server" | "dm";
  recipient?: {
    username: string;
    avatar_url: string;
  };
  currentUser: string
};

function appendUniqueMessages(
  currentMessages: Message[],
  incomingMessages: Message[]
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
  historyMessages = [],
  variant = "server",
  channel,
  recipient,
  thread_id,
  currentUser
}: Props) {
  const [messages, setMessages] = useState<Message[]>(historyMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
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
    }))
  );

  const handleMessages = useCallback((msg: ResponseMessage) => {
    setMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]));

      // merge incoming messages: update existing or add new
      for (const incoming of msg.messages) {
        if (byId.has(incoming.id)) {
          const existing = byId.get(incoming.id)!;
          byId.set(incoming.id, { ...existing, ...incoming });
        } else {
          byId.set(incoming.id, incoming);
        }
      }

      // preserve previous order, replacing updated entries; then append any new messages in incoming order
      const result: Message[] = [];
      const seen = new Set<string>();
      for (const m of prev) {
        if (byId.has(m.id)) {
          result.push(byId.get(m.id)!);
          seen.add(m.id);
        }
      }

      for (const incoming of msg.messages) {
        if (!seen.has(incoming.id)) {
          result.push(incoming);
          seen.add(incoming.id);
        }
      }

      return result;
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleEdit = useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, content, updated_at: new Date().toISOString() } : m
      )
    );
  }, []);

  const handleToggleReaction = useCallback((id: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const reactions = m.reactions ?? [];
        const hasReacted = reactions.some(
          (r) => r.user_id === currentUser && r.emoji === emoji
        );
        if (hasReacted) {
          return {
            ...m,
            reactions: reactions.filter(
              (r) => !(r.user_id === currentUser && r.emoji === emoji)
            ),
          };
        }
        return {
          ...m,
          reactions: [...reactions, { user_id: currentUser, emoji }],
        };
      })
    );
  }, []);

  const { sendMessage, status } = useWebSocket(serverId, channel.id, {
    onMessage: handleMessages,
    onDelete: handleDelete,
    onClose: () => console.log("disconnected"),
    onError: (e) => console.error("ws error", e),
  });

  useEffect(() => {
    setMessages(historyMessages);
  }, [historyMessages]);



  const isThread = Boolean(thread_id);

  return (
    <div className="flex h-full min-h-0 flex-1">
      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        {isThread && (
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-500/8 border-b border-indigo-500/15">
            <MessageSquareText size={14} className="text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-300/80">
              You&apos;re viewing a <span className="font-semibold text-indigo-300">thread</span> — replies here are separate from the main channel.
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-5 px-4 py-4">
            {messages.map((m) => (
              <ChatItem
                currentUser={currentUser}
                variant="channel"
                key={m.id}
                message={m}
                serverId={serverId}
                handleDelete={handleDelete}
                onEdit={handleEdit}
                onToggleReaction={handleToggleReaction}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Sticky bottom form */}
        <div className="shrink-0">
          {selectedMsg && (
            <ReplyBar
              message={selectedMsg}
              onCancel={() => setSelectedMsg(null)}
            />
          )}
          <ChatForm
            thread_id={thread_id ?? null}
            userId={currentUser}
            channelName={displayName}
            channelId={channel.id}
            placeholder={
              isThread
                ? `Reply in thread · #${channel.name}`
                : isDirectMessage
                  ? `Message @${displayName}`
                  : `Message #${channel.name}`
            }
            sendMessage={sendMessage}
            status={status}
          />
        </div>
      </div>

      {!isDirectMessage && <MemberList isOpen={isMemberOpen} serverId={serverId} />}
    </div>
  );
}
