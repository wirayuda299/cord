"use client";

import {
   useState,
   useEffect,
   useRef,
   useCallback,
   Dispatch,
   SetStateAction,
} from "react";
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

type SearchFormProps = {
   serverID: string;
   channelID: string;
   isExpanded: boolean;
   setIsExpanded: Dispatch<SetStateAction<boolean>>;
};

export default function SearchForm({
   serverID,
   channelID,
   isExpanded,
   setIsExpanded,
}: SearchFormProps) {
   const [results, setResults] = useState<SearchResult[]>([]);
   const [isOpen, setIsOpen] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [isMobile, setIsMobile] = useState(false);

   const containerRef = useRef<HTMLDivElement>(null);
   const inputRef = useRef<HTMLInputElement | null>(null);

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
         setResults(
            (await searchMessage(val.query, serverID, channelID)) || [],
         );
      } catch (e: any) {
         setError(e.message || "Failed to search message");
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      const mql = window.matchMedia("(min-width: 768px)");
      const update = () => setIsMobile(!mql.matches);
      update();
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
   }, []);

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (
            containerRef.current &&
            !containerRef.current.contains(event.target as Node)
         ) {
            setIsOpen(false);
            // Collapse the mobile search bar back to icon-only when clicking away
            // (md+ always stays visually expanded via CSS, so this only affects mobile).
            setIsExpanded(false);
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

   // On mobile, tapping the icon while collapsed should expand the field
   // instead of submitting the (likely empty) form. On md+ it always submits normally.
   const handleSearchButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isMobile && !isExpanded) {
         e.preventDefault();
         setIsExpanded(true);
         setTimeout(() => inputRef.current?.focus(), 50);
      }
   };

   const handleClear = () => {
      form.setValue("query", "");
      setIsOpen(false);
      setResults([]);
      if (isMobile) {
         setIsExpanded(false);
      } else {
         inputRef.current?.focus();
      }
   };

   return (
      <div ref={containerRef} className="relative">
         <form
            onSubmit={form.handleSubmit(handleSearchMessage)}
            className={`flex items-center gap-2 transition-all duration-300 ease-in-out overflow-hidden rounded-xs md:w-64 md:h-auto md:px-3 md:py-1.5 md:justify-start lg:w-80 ${
               isExpanded
                  ? "w-48 sm:w-64 px-3 py-1.5 justify-start bg-sidebar-primary"
                  : "w-9 h-9 px-0 py-0 justify-center md:bg-sidebar-primary"
            } `}
         >
            <Controller
               control={form.control}
               name="query"
               render={({ field, fieldState }) => (
                  <div
                     className={`items-center gap-1.5 flex-1 md:flex min-w-0 ${
                        isExpanded ? "flex" : "hidden"
                     }`}
                  >
                     <input
                        {...field}
                        ref={(el) => {
                           field.ref(el);
                           inputRef.current = el;
                        }}
                        className="bg-transparent focus-visible:ring-0 text-white placeholder:text-gray-400 md:text-sm w-full outline-none border-none focus:outline-none focus:border-none text-xs"
                        aria-invalid={fieldState.invalid}
                        placeholder="search message..."
                        autoComplete="off"
                     />
                     {field.value && (
                        <button
                           type="button"
                           onClick={handleClear}
                           className="text-gray-500 hover:text-white transition-colors shrink-0"
                        >
                           <X size={14} />
                        </button>
                     )}
                  </div>
               )}
            />

            <button
               type={isMobile && !isExpanded ? "button" : "submit"}
               onClick={handleSearchButtonClick}
               aria-label="Search messages"
               className="shrink-0 cursor-pointer flex items-center justify-center"
            >
               <Search
                  className="text-gray-500 hover:text-white transition-colors"
                  size={15}
               />
            </button>
         </form>

         {isOpen && (
            <div className="fixed inset-x-2 sm:inset-x-auto sm:right-0 mt-2 sm:w-96 h-[70vh] sm:h-100 max-h-[70vh] flex flex-col bg-sidebar-primary border border-gray-700/50 rounded-lg shadow-2xl z-50 overflow-hidden">
               <div className="flex items-center justify-between p-3 border-b border-gray-700/50 bg-sidebar-primary sticky top-0 z-10">
                  <span className="text-xs font-semibold text-gray-300">
                     Search Results ({results.length})
                  </span>
                  <button
                     type="button"
                     onClick={() => {
                        setIsOpen(false);
                        if (isMobile) setIsExpanded(false);
                     }}
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
                                 <p className="text-xs text-gray-300 wrap-break-word mt-0.5 line-clamp-2">
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
