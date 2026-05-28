'use client'

import { deletePinnedMessage } from "@/lib/server/actions/messages";
import type { PinnedMessage } from "@/lib/types/chat";
import { X } from "lucide-react";
import { useCallback } from "react";

export default function PinnedMessageItem({
  pinnedMessages,
}: {
  pinnedMessages: PinnedMessage[];
}) {

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await deletePinnedMessage(id)
      console.log(res)
    } catch (e) {
      alert(e)
    }

  }, [])
  return (
    <>
      <header className="flex items-center justify-between bg-sidebar-primary sticky top-0 h-10 px-3">
        <h2 className="text-sm font-semibold "> Pinned Message </h2>
        <p className="text-xs text-gray-400 lowercase">
          {pinnedMessages?.length} pinned
        </p>
      </header>
      <ul className="flex flex-col gap-3">
        {pinnedMessages.map((m) => (
          <li
            key={m.id}
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
            <button className='cursor-pointer' onClick={() => handleDelete(m.id)}>
              <X size={18} />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
