import { X } from "lucide-react";

import type { Message } from "@/lib/types/chat";

type ReplyBarProps = {
  message: Message;
  onCancel: () => void;
};

export default function ReplyBar({ message, onCancel }: ReplyBarProps) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 bg-surface-raised border-t border-white/6 animate-in slide-in-from-bottom-1 duration-150">
      <div className="w-3 h-9 bg-indigo-500 rounded-full shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-secondary">
          Replying to{" "}
          <span className="text-indigo-400 font-medium">
            {message.username}
          </span>
        </p>
        <p className="text-sm text-text-muted truncate max-w-md">
          {message.content}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="w-7 h-7 rounded-full flex items-center justify-center text-text-secondary hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
      >
        <X size={15} />
      </button>
    </div>
  );
}
