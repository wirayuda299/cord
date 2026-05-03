import { format } from "date-fns";
import Image from "next/image";
import { memo, useEffect, useState } from "react";
import { AlertCircle, Loader2, Reply } from "lucide-react";

import MessageMenu from "./MessageMenu";
import type { Message } from "@/lib/types/chat";

type ChatItemProps = {
   message: Message;
   serverId: string;
   handleDelete?: (id: string) => void;
   onCreateThread?: (message: Message) => void;
};

type ReplyThreadProps = {
   parent_content: string | null;
   parent_msg_id: string | null;
   parent_username: string | null;
};

function ReplyThread({
   parent_content,
   parent_msg_id,
   parent_username,
}: ReplyThreadProps) {
   if (!parent_content || !parent_msg_id || !parent_username) return null;
   return (
      <a
         href={`#${parent_msg_id}`}
         className="flex items-center gap-3 hover:underline"
      >
         <span className="size-5 bg-sidebar-primary/50 flex items-center justify-center rounded-full ml-5">
            <Reply size={12} className="text-white" />
         </span>
         <span className="text-green-500 font-medium text-xs hover:underline">
            {parent_username}
         </span>
         <span className="text-white/70 text-xs font-medium truncate max-w-xs">
            {parent_content}
         </span>
      </a>
   );
}

type MessageContentProps = {
   message: Pick<Message, "image_url" | "content" | "_status">;
};

function AttachmentImage({
   src,
   status,
}: {
   src: string;
   status?: Message["_status"];
}) {
   const isBlob = src.startsWith("blob:");
   const img = isBlob ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} className="rounded max-w-[300px]" alt="attachment" />
   ) : (
      <Image
         className="rounded aspect-contain"
         src={src}
         width={300}
         height={300}
         alt="attachment"
         loading="lazy"
      />
   );

   if (status === "uploading") {
      return (
         <div className="relative inline-block">
            <div className="opacity-50">{img}</div>
            <div className="absolute inset-0 flex items-center justify-center">
               <Loader2 size={24} className="animate-spin text-white drop-shadow" />
            </div>
         </div>
      );
   }

   return img;
}

function MessageContent({ message }: MessageContentProps) {
   if (!message.image_url) {
      return (
         <p className="text-sm text-gray-300 wrap-break-word">{message.content}</p>
      );
   }
   return (
      <div>
         <AttachmentImage src={message.image_url} status={message._status} />
         {message.content && (
            <p className="text-sm text-gray-300 wrap-break-word">
               {message.content}
            </p>
         )}
      </div>
   );
}

type MessageHeaderProps = {
   username: string;
   isBot: boolean;
   created_at: string;
};

function MessageHeader({ username, isBot, created_at }: MessageHeaderProps) {
   const [formattedTime, setFormattedTime] = useState("");

   useEffect(() => {
      setFormattedTime(format(created_at, "hh:mm a"));
   }, [created_at]);

   return (
      <div className="flex items-center gap-2">
         <span className="text-sm font-semibold text-white hover:underline cursor-pointer">
            {username}
         </span>
         {isBot && (
            <span className="text-[10px] bg-indigo-500 text-white px-1 rounded font-medium">
               BOT
            </span>
         )}
         <span className="text-[11px] text-gray-400">{formattedTime}</span>
      </div>
   );
}

function ChatItem({
   message,
   serverId,
   handleDelete,
   onCreateThread,
}: ChatItemProps) {
   const isFailed = message._status === "failed";

   return (
      <div
         id={message.id}
         data-chat-item
         className={`hover:bg-white/5 group transition-colors px-4 py-1 relative ${isFailed ? "opacity-60" : ""}`}
      >
         <ReplyThread
            parent_content={message.parent_content}
            parent_msg_id={message.parent_msg_id}
            parent_username={message.parent_username}
         />
         <div className="flex items-start gap-3">
            {message.avatar ? (
               <Image
                  src={message.avatar}
                  alt={message.username}
                  width={40}
                  height={40}
                  className="rounded-full mt-0.5 shrink-0 size-9"
                  loading="lazy"
               />
            ) : (
               <div className="rounded-full mt-0.5 shrink-0 size-9 bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold select-none">
                  {message.username.charAt(0).toUpperCase()}
               </div>
            )}
            <div className="flex flex-col min-w-0 flex-1">
               <MessageHeader
                  username={message.username}
                  isBot={false}
                  created_at={message.created_at}
               />
               <MessageContent message={message} />
               {isFailed && (
                  <div className="flex items-center gap-1.5 mt-1 text-red-400 text-xs">
                     <AlertCircle size={12} />
                     <span>Failed to send.</span>
                     <button
                        onClick={() => handleDelete?.(message.id)}
                        className="underline hover:text-red-300 transition-colors"
                     >
                        Dismiss
                     </button>
                  </div>
               )}
            </div>
            {!isFailed && (
               <MessageMenu
                  onDelete={handleDelete ?? (() => {})}
                  message={message}
                  serverId={serverId}
                  onCreateThread={() => onCreateThread?.(message)}
               />
            )}
         </div>
      </div>
   );
}

export default memo(ChatItem);
