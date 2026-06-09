'use client'

import { deletePinnedMessage } from "@/lib/server/actions/messages";
import type { PinnedMessage } from "@/lib/types/chat";
import { X } from "lucide-react";
import { useCallback } from "react";

export default function PinnedMessageItem({
  pinnedMessages,
  canDelete,
  serverId
}: {
  pinnedMessages: PinnedMessage[];
  canDelete: boolean
  serverId: string
}) {

  const handleDelete = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await deletePinnedMessage(id, serverId)
      console.log(res)
    } catch (e) {
      alert(e)
    }
  }, [serverId])

  const handleJumpToMessage = useCallback((messageId: string) => {
    // Wait a brief moment for the dropdown menu to close so layout is stable
    setTimeout(() => {
      const element = document.getElementById(messageId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });

        // Remove animation class if present, then force reflow to restart animation on multiple clicks
        element.classList.remove("animate-flash-message");
        void element.offsetWidth;

        // Visual feedback: briefly highlight the target message
        element.classList.add("animate-flash-message");
        setTimeout(() => {
          element.classList.remove("animate-flash-message");
        }, 3000);

      } else {
        console.warn(`Message with ID ${messageId} not found in DOM`);
      }
    }, 100);
  }, []);

  return (
    <>
      <header className="flex items-center justify-between bg-sidebar-primary sticky top-0 h-10 px-3">
        <h2 className="text-sm font-semibold">Pinned Messages</h2>
        <p className="text-xs text-gray-400 lowercase">
          {pinnedMessages?.length} pinned
        </p>
      </header>

      <ul className="flex flex-col gap-3">
        {pinnedMessages.map((m) => (
          <li
            key={m.id}
            onClick={() => handleJumpToMessage(m.id)}
            className="flex items-center gap-2 py-2 hover:bg-sidebar-primary hover:brightness-125 rounded-md px-3 cursor-pointer"
          >
            <div className="flex-1 space-y-1">
              <h3 className="text-xs font-semibold capitalize">
                <span> {m.username} </span>
              </h3>
              <p className="font-medium text-gray-400 text-xs line-clamp-2">
                {m.content}
              </p>
            </div>
            {canDelete && (
              <button
                onClick={(e) => handleDelete(e, m.id)}
                className="p-1 rounded hover:bg-red-500/10">
                <X className="text-red-500" size={16} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
