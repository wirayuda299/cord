"use client";

import { X, Send } from "lucide-react";
import { FormEvent, memo, useEffect, useRef, useState } from "react";
import type { Message } from "@/lib/types/chat";
import ChatItem from "../ChatItem";

type ThreadPanelProps = {
  parentMessage: Message | null;
  threadMessages: Message[];
  isOpen: boolean;
  isLoading?: boolean;
  isSending?: boolean;
  onClose: () => void;
  onSendReply: (content: string) => Promise<void> | void;
  onDeleteMessage?: (id: string) => void;
  serverId: string;
  channel_id: string
};

function ThreadPanel({
  parentMessage,
  threadMessages,
  isOpen,
  isLoading = false,
  isSending = false,
  onClose,
  onSendReply,
  onDeleteMessage,
  serverId,
  channel_id
}: ThreadPanelProps) {
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [isOpen, threadMessages.length]);

  if (!isOpen || !parentMessage) return null;

  const totalMessages = threadMessages.length + 1;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmed = content.trim();

    if (!trimmed || isSending) return;

    await onSendReply(trimmed);
    setContent("");
  }

  return (
    <aside className="flex h-full w-96 shrink-0 flex-col bg-sidebar-secondary border-l border-white/5 overflow-hidden">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/5 px-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-200">Thread</div>
          <div className="text-xs text-zinc-500">
            {totalMessages} {totalMessages === 1 ? "message" : "messages"}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close thread"
          className="rounded p-1 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200"
        >
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-white/10 bg-white/5 px-2 py-4">
          <div className="rounded border border-white/10 bg-white/5 px-2 py-2">
            <ChatItem
              message={parentMessage}
              serverId={serverId}
              handleDelete={onDeleteMessage}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-sm text-zinc-500">
            Loading thread...
          </div>
        ) : threadMessages.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-zinc-500">
            No replies yet
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {threadMessages.map((msg) => (
              <div
                key={msg.id}
                className="px-2 py-3 transition-colors hover:bg-white/5"
              >
                <ChatItem
                  message={msg}
                  serverId={serverId}
                  handleDelete={onDeleteMessage}
                  variant="thread-reply"
                />
              </div>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-white/10 px-3 py-3"
      >
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2.5 transition-colors focus-within:border-discord-brand">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Reply in thread..."
            disabled={isSending}
            className="flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!content.trim() || isSending}
            aria-label="Send reply"
            className="rounded p-1 text-discord-brand transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </aside>
  );
}

export default memo(ThreadPanel);
