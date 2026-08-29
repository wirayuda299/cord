"use client";

import { cn } from "@/lib/utils";
import {
   Hash,
   ChevronRight,
   MessageSquareText,
   ArrowLeft,
   Menu,
} from "lucide-react";
import { Channel } from "@/types/channel";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { getThreadById } from "@/lib/api/threads";
import type { ReactNode } from "react";
import { useAppStore } from "@/stores/store";

type ChannelHeaderProps = {
   channel: Channel;
   actions: ReactNode;
};

export default function ChannelHeader({
   channel,
   actions,
}: ChannelHeaderProps) {
   const params = useParams<{
      id: string;
      channel_id: string;
      thread_id?: string;
   }>();
   const thread_id = params?.thread_id;
   const isInThread = Boolean(thread_id);

   const {
      data: threadData,
      error,
      isLoading,
   } = useSWR(thread_id ?? null, getThreadById);
   const setChannelSidebarOpen = useAppStore((state) => state.setChannelSidebarOpen);

   const threadName: string | null = threadData?.name ?? null;

   const backHref = isInThread
      ? `/${params.id}/${params.channel_id}`
      : undefined;

   if (error) return <p>{error}</p>;

   return (
      <phantom-ui loading={isLoading}>
         <header className="h-14 shrink-0 px-2.5 shadow gap-4 border-b border-gray-600/50 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
               <div className="flex items-center gap-3 h-full">
                  <button
                     onClick={() => setChannelSidebarOpen(true)}
                     aria-label="Open channel list"
                     className="flex items-center justify-center size-8 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 md:hidden cursor-pointer"
                  >
                     <Menu size={20} />
                  </button>
               </div>
               {isInThread && backHref && (
                  <Link
                     href={backHref}
                     aria-label="Back to channel"
                     className="flex items-center justify-center size-7 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                  >
                     <ArrowLeft size={16} />
                  </Link>
               )}

               <div
                  className={cn(
                     "flex items-center gap-1.5 shrink-0",
                     isInThread && "opacity-60",
                  )}
               >
                  <Hash size={15}  className="text-gray-400 shrink-0 text-xs" />
                  {isInThread && backHref ? (
                     <Link
                        href={backHref}
                        className="text-sm font-semibold text-gray-400 capitalize hover:text-white transition-colors"
                     >
                        {channel?.name}
                     </Link>
                  ) : (
                     <span className="text-xs md:text-sm font-semibold text-white capitalize">
                        {channel?.name}
                     </span>
                  )}
               </div>

               {isInThread && (
                  <>
                     <ChevronRight
                        size={14}
                        className="text-gray-600 shrink-0"
                     />
                     <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-2.5 py-0.5 min-w-0">
                        <MessageSquareText
                           size={13}
                           className="text-indigo-400 shrink-0"
                        />
                        <span className="text-xs font-semibold text-indigo-300 truncate max-w-50">
                           {threadName ?? "Thread"}
                        </span>
                     </div>
                     <span className="hidden sm:inline text-[11px] text-gray-500 italic shrink-0">
                        Thread messages
                     </span>
                  </>
               )}

               {!isInThread && channel.topic && (
                  <p className="text-xs truncate text-gray-400 hidden md:block lowercase border-l border-gray-600 pl-3">
                     {channel?.topic}
                  </p>
               )}
            </div>
            <div className="flex items-center gap-3">{actions}</div>
         </header>
      </phantom-ui>
   );
}
