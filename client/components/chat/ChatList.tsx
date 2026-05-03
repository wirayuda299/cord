"use client";

import type { Channel } from "@/lib/types/channel";
import type { Message, ResponseMessage } from "@/lib/types/chat";
import { useAppStore } from "@/stores/store";
import { Hash } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import ChatItem from "./ChatItem";
import ChatForm from "./ChatForm";
import MemberList from "@/components/members/MemberList";
import ReplyBar from "./ReplyBar";
import ThreadPanel from "./threads/ThreadPanel";
import { useThread } from "./threads/useThread";

type Props = {
   channel: Channel;
   serverId: string;
   historyMessages: Message[];
};

function ChannelHeader({ channel }: { channel: Channel }) {
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

export default function ChatList({
   serverId,
   channel,
   historyMessages = [],
}: Props) {
   const [messages, setMessages] = useState<Message[]>(historyMessages);
   const pendingTempId = useRef<string | null>(null);
   const bottomRef = useRef<HTMLDivElement>(null);
   const { threadState, openThread, closeThread } = useThread();

   const { selectedMsg, setSelectedMsg, isOpen } = useAppStore(
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

   const addOptimistic = useCallback((msg: Message) => {
      pendingTempId.current = msg.id;
      setMessages((prev) => [...prev, msg]);
   }, []);

   const handleUploadComplete = useCallback((tempId: string) => {
      setMessages((prev) =>
         prev.map((m) => (m.id === tempId ? { ...m, _status: undefined } : m)),
      );
   }, []);

   const handleUploadFailed = useCallback((tempId: string) => {
      setMessages((prev) =>
         prev.map((m) =>
            m.id === tempId ? { ...m, _status: "failed" as const } : m,
         ),
      );
      pendingTempId.current = null;
   }, []);

   const handleMessages = useCallback((msg: ResponseMessage) => {
      setMessages((prev) => {
         const tempId = pendingTempId.current;
         if (tempId) {
            const temp = prev.find((m) => m.id === tempId);
            if (temp?.image_url.startsWith("blob:")) {
               URL.revokeObjectURL(temp.image_url);
            }
            pendingTempId.current = null;
            return [...prev.filter((m) => m.id !== tempId), ...msg.messages];
         }
         return [...prev, ...msg.messages];
      });
   }, []);

   const handleDelete = useCallback((id: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
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
               <ChannelHeader channel={channel} />
               <div className="flex flex-col gap-5 pb-4">
                  {messages.map((m) => (
                     <ChatItem
                        key={m.id}
                        message={m}
                        serverId={serverId}
                        handleDelete={handleDelete}
                        onCreateThread={handleCreateThread}
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
                  userId="usr_001"
                  channelName={channel.name}
                  channelId={channel.id}
                  serverId={serverId}
                  handleMessages={handleMessages}
                  handleDelete={handleDelete}
                  onOptimistic={addOptimistic}
                  onUploadComplete={handleUploadComplete}
                  onUploadFailed={handleUploadFailed}
               />
            </div>
         </div>

         <MemberList isOpen={isOpen} />
         <ThreadPanel
            parentMessage={threadState.parentMessage}
            threadMessages={threadState.threadMessages}
            isOpen={threadState.isOpen}
            onClose={closeThread}
            onDeleteMessage={handleDelete}
            serverId={serverId}
         />
      </div>
   );
}
