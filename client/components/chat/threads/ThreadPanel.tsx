"use client";

import { X } from "lucide-react";
import { memo } from "react";
import type { Message } from "@/lib/types/chat";
import ChatItem from "../ChatItem";

type ThreadPanelProps = {
  parentMessage: Message | null;
  threadMessages: Message[];
  isOpen: boolean;
  onClose: () => void;
  onDeleteMessage?: (id: string) => void;
  serverId: string;
};

function ThreadPanel({
  parentMessage,
  threadMessages,
  isOpen,
  onClose,
  onDeleteMessage,
  serverId,
}: ThreadPanelProps) {
  if (!isOpen || !parentMessage) return null;

  return (
    <div className="flex flex-col w-80 bg-sidebar-secondary border-l border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-200">Thread</span>
          <span className="text-xs text-zinc-500">
            {threadMessages.length + 1} messages
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 transition-colors text-zinc-400 hover:text-zinc-200"
        >
          <X size={18} />
        </button>
      </div>

      {/* Thread Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Parent Message */}
        <div className="px-2 py-4 border-b border-white/10 bg-white/5">
          <div className="px-2 py-2 rounded bg-white/5 border border-white/10">
            <ChatItem
              message={parentMessage}
              serverId={serverId}
              handleDelete={onDeleteMessage}
            />
          </div>
        </div>

        {/* Thread Replies */}
        <div className="flex-1">
          {threadMessages.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
              No replies yet
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {threadMessages.map((msg) => (
                <div key={msg.id} className="px-2 py-3 hover:bg-white/5 transition-colors">
                  <ChatItem
                    message={msg}
                    serverId={serverId}
                    handleDelete={onDeleteMessage}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply Input */}
        <div className="px-3 py-3 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-white/5 border border-white/10 focus-within:border-discord-brand transition-colors">
            <input
              type="text"
              placeholder="Reply in thread..."
              className="flex-1 bg-transparent outline-none text-sm text-zinc-200 placeholder:text-zinc-600"
            />
            <button className="p-1 rounded hover:bg-white/10 transition-colors text-discord-brand">
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ThreadPanel);
