"use client";

import { copyText } from "@/lib/client/clipboard";
import { cn } from "@/lib/utils";
import { Check, Copy, Search, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const mockUsers = [
  { id: 1, name: "Alice", avatar: "https://i.pravatar.cc/40?img=1" },
  { id: 2, name: "Bob", avatar: "https://i.pravatar.cc/40?img=2" },
  { id: 3, name: "Charlie", avatar: "https://i.pravatar.cc/40?img=3" },
  { id: 4, name: "David", avatar: "https://i.pravatar.cc/40?img=4" },
  { id: 5, name: "Eve", avatar: "https://i.pravatar.cc/40?img=5" },
] as const;

type MockUser = (typeof mockUsers)[number];

export default function FriendList() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MockUser[]>([]);

  const filtered = mockUsers.filter((u) =>
    u.name.toLowerCase().includes(query.toLowerCase()),
  );

  const toggleUser = (user: MockUser) => {
    setSelected((prev) => {
      if (prev.find((u) => u.id === user.id)) {
        return prev.filter((u) => u.id !== user.id);
      }
      return [...prev, user];
    });
  };

  return (

    <div className="w-full max-w-md bg-surface-raised text-white rounded-2xl shadow-xl p-4">
      <h2 className="text-lg font-semibold mb-3">Invite Friends</h2>

      <div className="flex items-center bg-bg-input px-3 py-2 rounded-lg mb-3">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search friends"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent outline-none ml-2 w-full text-sm"
        />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 bg-discord-brand px-2 py-1 rounded-full text-sm"
            >
              <Image alt="avatar" src={user.avatar} className="w-5 h-5 rounded-full" />
              {user.name}
              <button onClick={() => toggleUser(user)}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="max-h-60 overflow-y-auto space-y-1">
        {filtered.map((user) => {
          const isSelected = selected.find((u) => u.id === user.id);
          return (
            <div
              key={user.id}
              onClick={() => toggleUser(user)}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-hover cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Image
                  width={32}
                  height={32}
                  alt="avatar"
                  src={user.avatar}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm">{user.name}</span>
              </div>

              <div
                className={cn("w-5 h-5 flex items-center justify-center rounded-md border", isSelected
                  ? "bg-discord-brand border-discord-brand"
                  : "border-gray-500")}
              >
                {isSelected && <Check size={14} />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between bg-sidebar-primary p-3 rounded-md mt-2">
        <p className="truncate">https://discord.clone.app/1233</p>
        <button
          className="cursor-pointer"
          onClick={() =>
            copyText("https://discord.clone.app/1233").then(() => alert("Invitation code copied"))}>
          <Copy size={20} />
        </button>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {selected.length} selected
        </span>
        <button className="bg-discord-brand hover:bg-accent-blue cursor-pointer px-4 py-2 rounded-lg text-sm">
          Send Invite
        </button>
      </div>
    </div>
  );
}
