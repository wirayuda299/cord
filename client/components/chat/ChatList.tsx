"use client";

import type { Message, ResponseMessage } from "@/lib/types/chat";
import { useAppStore } from "@/stores/store";
import { useCallback, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import ChatItem from "./ChatItem";
import ChatForm from "./ChatForm";
import MemberList from "@/components/members/MemberList";
import ReplyBar from "./ReplyBar";
import { useWebSocket } from "@/hooks/useWebsocket";
import { MessageSquareText } from "lucide-react";
import useSWR from "swr";
import { hasPermission } from "@/lib/client/api/permissions";
import { PermissionKey } from "@/constants/permissions";
import { useAuth } from "@clerk/nextjs";
import { isMemberBanned } from "@/lib/server/actions/members";

type Props = {
   channel: {
      id: string;
      channel_type: string;
      name: string;
      topic: string;
   };
   serverOwner: string;
   thread_id?: string | null;
   serverId: string;
   historyMessages: Message[];
   variant?: "server" | "dm";
   recipient?: {
      username: string;
      avatar_url: string;
   };
   currentUser?: string;
};

export default function ChatList({
   serverId,
   historyMessages = [],
   variant = "server",
   channel,
   recipient,
   thread_id,
   currentUser,
   serverOwner,
}: Props) {
   const { getToken } = useAuth();
   const {
      data: allowed,
      error,
      isLoading,
   } = useSWR(serverId ? ["/api/has-perm", serverId] : null, async () => {
      const token = await getToken();
      return hasPermission(serverId, PermissionKey.ManageMessage, token);
   });

   const { data: isBanned = false } = useSWR(
      serverId ? ["/api/is-banned", serverId] : null,
      async () => {
         return isMemberBanned(serverId);
      },
      { refreshInterval: 5000 },
   );

   const currUser = currentUser ?? "";
   const [messages, setMessages] = useState<Message[]>(historyMessages);
   const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
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
      })),
   );

   const handleMessages = useCallback(
      (msg: ResponseMessage) => {
         // Filter messages that belong to this channel or thread
         const relevantMessages = msg.messages.filter((m) => {
            if (thread_id) {
               return m.thread_id === thread_id;
            }
            return m.channel_id === channel.id && !m.thread_id;
         });

         if (relevantMessages.length === 0) return;

         setMessages((prev) => {
            const byId = new Map(prev.map((m) => [m.id, m]));

            // merge incoming messages: update existing or add new
            for (const incoming of relevantMessages) {
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

            for (const incoming of relevantMessages) {
               if (!seen.has(incoming.id)) {
                  result.push(incoming);
                  seen.add(incoming.id);
               }
            }

            return result;
         });
      },
      [channel.id, thread_id],
   );

   const handleDelete = useCallback((id: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
   }, []);

   const handleEdit = useCallback((id: string, content: string) => {
      setMessages((prev) =>
         prev.map((m) =>
            m.id === id
               ? { ...m, content, updated_at: new Date().toISOString() }
               : m,
         ),
      );
   }, []);

   const handleToggleReaction = useCallback(
      (id: string, emoji: string) => {
         setMessages((prev) =>
            prev.map((m) => {
               if (m.id !== id) return m;
               const reactions = m.reactions ?? [];
               const hasReacted = reactions.some(
                  (r) => r.user_id === currUser && r.emoji === emoji,
               );
               if (hasReacted) {
                  return {
                     ...m,
                     reactions: reactions.filter(
                        (r) => !(r.user_id === currUser && r.emoji === emoji),
                     ),
                  };
               }
               return {
                  ...m,
                  reactions: [...reactions, { user_id: currUser, emoji }],
               };
            }),
         );
      },
      [currUser],
   );

   const { sendMessage, status } = useWebSocket(serverId, channel.id, {
      onMessage: handleMessages,
      onDelete: handleDelete,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onEvent: (ev: any) => {
         if (ev && ev.type === "user_list") {
            setOnlineIds(new Set(ev.user_ids));
         } else if (ev && ev.type === "user_status") {
            setOnlineIds((prev) => {
               const next = new Set(prev);
               if (ev.action === "connected") {
                  next.add(ev.user_id);
               } else if (ev.action === "disconnected") {
                  next.delete(ev.user_id);
               }
               return next;
            });
         }
      },
      onClose: () => console.log("disconnected"),
      onError: (e) => console.error("ws error", e),
   });

   const isThread = Boolean(thread_id);

   if (isLoading) return <p>loading permission</p>;
   if (error) return <p>{error}</p>;

   return (
      <div className="flex h-full min-h-0 flex-1">
         <div className="flex flex-col flex-1 min-h-0 min-w-0">
            {isThread && (
               <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-500/8 border-b border-indigo-500/15">
                  <MessageSquareText
                     size={14}
                     className="text-indigo-400 shrink-0"
                  />
                  <p className="text-xs text-indigo-300/80">
                     You&apos;re viewing a{" "}
                     <span className="font-semibold text-indigo-300">
                        thread
                     </span>{" "}
                     — replies here are separate from the main channel.
                  </p>
               </div>
            )}

            <div className="flex-1 overflow-y-auto">
               <div className="flex flex-col gap-5 px-4 py-4">
                  {messages.map((m) => (
                     <ChatItem
                        hasPermissionManageMessages={!!allowed}
                        currentUser={currUser}
                        variant="channel"
                        key={m.id}
                        message={m}
                        serverId={serverId}
                        handleDelete={handleDelete}
                        onEdit={handleEdit}
                        onToggleReaction={handleToggleReaction}
                        isBanned={isBanned}
                     />
                  ))}
                  <div ref={bottomRef} />
               </div>
            </div>

            <div className="shrink-0">
               {selectedMsg && (
                  <ReplyBar
                     message={selectedMsg}
                     onCancel={() => setSelectedMsg(null)}
                  />
               )}
               <ChatForm
                  serverID={serverId}
                  thread_id={thread_id ?? null}
                  userId={currUser}
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
                  isBanned={isBanned}
               />
            </div>
         </div>

         {!isDirectMessage && (
            <MemberList
               serverOwner={serverOwner}
               isOpen={isMemberOpen}
               serverId={serverId}
               onlineIds={onlineIds}
            />
         )}
      </div>
   );
}
