"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { searchMessage } from "@/lib/client/api/messages";
import Image from "next/image";

interface SearchResult {
   id: string;
   content: string;
   thread_id: string | null;
   username: string;
   avatar_url: string;
}

export default function SearchForm({
   serverID,
   channelID,
}: {
   serverID: string;
   channelID: string;
}) {
   const [results, setResults] = useState<SearchResult[]>([]);
   const [isOpen, setIsOpen] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const containerRef = useRef<HTMLDivElement>(null);

   const form = useForm({
      defaultValues: {
         query: "",
      },
   });

   const handleSearchMessage = async (val: { query: string }) => {
      if (!val.query.trim()) return;
      setIsLoading(true);
      setError(null);
      setIsOpen(true);
      try {
         const messages = await searchMessage(val.query, serverID, channelID);
         console.log(messages);
         setResults(messages || []);
      } catch (e: any) {
         setError(e.message || "Failed to search message");
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (
            containerRef.current &&
            !containerRef.current.contains(event.target as Node)
         ) {
            setIsOpen(false);
         }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
         document.removeEventListener("mousedown", handleClickOutside);
      };
   }, []);

   const handleJumpToMessage = useCallback((messageId: string) => {
      const element = document.getElementById(messageId);
      if (element) {
         // Scroll to element (fallback-equipped manual centering)
         const container = element.closest(".overflow-y-auto");
         if (container) {
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const targetTop =
               container.scrollTop +
               (elementRect.top - containerRect.top) -
               containerRect.height / 2 +
               elementRect.height / 2;
            container.scrollTo({ top: targetTop, behavior: "smooth" });
         } else {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
         }

         // Visual feedback: briefly highlight the target message (CSS Class + Inline style backup)
         element.classList.remove("animate-flash-message");
         void element.offsetWidth; // force reflow
         element.classList.add("animate-flash-message");

         const originalBg = element.style.backgroundColor;
         const originalTransition = element.style.transition;
         element.style.transition = "background-color 0.15s ease-out";
         element.style.backgroundColor = "rgba(88, 101, 242, 0.35)";

         setTimeout(() => {
            element.style.transition = "background-color 1s ease-in-out";
            element.style.backgroundColor = originalBg;
            setTimeout(() => {
               element.style.transition = originalTransition;
               element.classList.remove("animate-flash-message");
            }, 1000);
         }, 2000);
      } else {
         console.warn(`Message with ID ${messageId} not found in DOM`);
      }
      setIsOpen(false);
   }, []);

   return (
      <div ref={containerRef} className="relative">
         <form
            onSubmit={form.handleSubmit(handleSearchMessage)}
            className="flex items-center gap-2 bg-sidebar-primary rounded px-3 py-1.5 w-64 md:w-80"
         >
            <Controller
               control={form.control}
               name="query"
               render={({ field, fieldState }) => (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                     <input
                        {...field}
                        className="bg-transparent focus-visible:ring-0 text-white placeholder:text-gray-400 text-sm w-full outline-none border-none focus:outline-none focus:border-none"
                        aria-invalid={fieldState.invalid}
                        placeholder="search message..."
                        autoComplete="off"
                     />
                     {field.value && (
                        <button
                           type="button"
                           onClick={() => {
                              form.setValue("query", "");
                              setIsOpen(false);
                              setResults([]);
                           }}
                           className="text-gray-500 hover:text-white transition-colors"
                        >
                           <X size={14} />
                        </button>
                     )}
                  </div>
               )}
            />

            <button type="submit" className="shrink-0 cursor-pointer">
               <Search
                  className="text-gray-500 hover:text-white transition-colors"
                  size={15}
               />
            </button>
         </form>

         {isOpen && (
            <div className="fixed right-0 mt-2  w-80 sm:w-[400px] h-[400px] max-h-[70vh] flex flex-col bg-sidebar-primary border border-gray-700/50 rounded-lg shadow-2xl z-50 overflow-hidden">
               <div className="flex items-center justify-between p-3 border-b border-gray-700/50 bg-sidebar-primary sticky top-0 z-10">
                  <span className="text-xs font-semibold text-gray-300">
                     Search Results ({results.length})
                  </span>
                  <button
                     type="button"
                     onClick={() => setIsOpen(false)}
                     className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                     <X size={16} />
                  </button>
               </div>

               <div className="overflow-y-auto flex-1 p-2 scrollbar-thin">
                  {isLoading ? (
                     <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
                        <Loader2
                           className="animate-spin text-indigo-500"
                           size={24}
                        />
                        <span className="text-xs">Searching messages...</span>
                     </div>
                  ) : error ? (
                     <div className="p-4 text-center text-xs text-red-400">
                        {error}
                     </div>
                  ) : results.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-xs">
                        No messages found matching query.
                     </div>
                  ) : (
                     <ul className="flex flex-col gap-1">
                        {results.map((msg) => (
                           <li
                              key={msg.id}
                              onClick={() => handleJumpToMessage(msg.id)}
                              className="flex items-start gap-3 p-2 rounded-md hover:bg-white/5 cursor-pointer transition-all duration-200"
                           >
                              {msg.avatar_url ? (
                                 <Image
                                    src={msg.avatar_url}
                                    alt={msg.username}
                                    width={32}
                                    height={32}
                                    className="size-8 rounded-full shrink-0 object-cover mt-0.5"
                                 />
                              ) : (
                                 <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white uppercase mt-0.5">
                                    {msg.username.charAt(0)}
                                 </div>
                              )}
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-white capitalize truncate">
                                       {msg.username}
                                    </span>
                                 </div>
                                 <p className="text-xs text-gray-300 break-words mt-0.5 line-clamp-2">
                                    {msg.content}
                                 </p>
                              </div>
                           </li>
                        ))}
                     </ul>
                  )}
               </div>
            </div>
         )}
      </div>
   );
}
