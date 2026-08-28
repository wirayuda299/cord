"use client";

import { copyText } from "@/lib/clipboard";
import { createInvitationCode } from "@/lib/actions/invitations";
import type { FriendListItem } from "@/types/friends";
import { Check, Copy, Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
   serverId: string;
   friends: FriendListItem[];
};

export default function FriendList({ serverId, friends }: Props) {
   const [query, setQuery] = useState("");
   const [inviteLink, setInviteLink] = useState<string | null>(null);
   const [linkError, setLinkError] = useState<string | null>(null);
   const [copiedId, setCopiedId] = useState<string | null>(null);

   useEffect(() => {
      let cancelled = false;

      async function createLink() {
         const result = await createInvitationCode(serverId);
         if (cancelled) return;

         if (!result.success) {
            setLinkError(result.message || "Failed to create invite link");
            return;
         }

         const data = result.data as { code?: string; data?: { code?: string } } | string | undefined;
         const code =
            typeof data === "string"
               ? data
               : (data?.code ?? data?.data?.code ?? null);

         if (!code) {
            setLinkError("Failed to create invite link");
            return;
         }

         setInviteLink(`${window.location.origin}/invite/${code}`);
      }

      createLink();
      return () => {
         cancelled = true;
      };
   }, [serverId]);

   const filtered = friends.filter((f) =>
      f.username.toLowerCase().includes(query.toLowerCase()),
   );

   const handleCopy = (id: string) => {
      if (!inviteLink) return;
      copyText(inviteLink).then(() => {
         setCopiedId(id);
         setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
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

         <div className="max-h-60 overflow-y-auto space-y-1">
            {filtered.length === 0 && (
               <p className="text-sm text-gray-400 text-center py-4">
                  {friends.length === 0 ? "No friends yet" : "No matching friends"}
               </p>
            )}
            {filtered.map((friend) => (
               <div
                  key={friend.user_id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-hover"
               >
                  <div className="flex items-center gap-3 min-w-0">
                     {friend.avatar_url ? (
                        <Image
                           width={32}
                           height={32}
                           alt={friend.username}
                           src={friend.avatar_url}
                           className="w-8 h-8 rounded-full object-cover"
                        />
                     ) : (
                        <div className="w-8 h-8 shrink-0 rounded-full bg-discord-brand/70 flex items-center justify-center text-xs font-bold text-white">
                           {friend.username.charAt(0).toUpperCase()}
                        </div>
                     )}
                     <span className="text-sm truncate">{friend.username}</span>
                  </div>

                  <button
                     type="button"
                     disabled={!inviteLink}
                     onClick={() => handleCopy(friend.user_id)}
                     title="Copy invite link"
                     className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-40 cursor-pointer transition-colors"
                  >
                     {copiedId === friend.user_id ? (
                        <>
                           <Check size={14} className="text-green-400" />
                           Copied
                        </>
                     ) : (
                        <>
                           <Copy size={14} />
                           Copy link
                        </>
                     )}
                  </button>
               </div>
            ))}
         </div>

         <div className="flex items-center justify-between bg-sidebar-primary p-3 rounded-md mt-3">
            <p className="truncate text-sm text-gray-300">
               {linkError ? linkError : (inviteLink ?? "Generating invite link...")}
            </p>
            <button
               className="cursor-pointer disabled:opacity-40"
               disabled={!inviteLink}
               onClick={() => inviteLink && copyText(inviteLink).then(() => setCopiedId("__link"))}
            >
               {copiedId === "__link" ? <Check size={20} /> : <Copy size={20} />}
            </button>
         </div>
      </div>
   );
}
