import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PendingRequests from "@/components/friends/PendingRequests";
import { Users, UserCheck, Clock, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import AllFriends from "@/components/friends/AllFriends";
import { Suspense } from "react";

type Tab = "online" | "all" | "pending" | "add";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
   { id: "online", label: "Online", icon: <Users size={16} /> },
   { id: "all", label: "All", icon: <UserCheck size={16} /> },
   { id: "pending", label: "Pending", icon: <Clock size={16} /> },
   { id: "add", label: "Add Friend", icon: <UserPlus size={16} /> },
];

const mockOnline = [
   { id: "1", name: "zara_dev", tag: "#2201", activity: "Playing Minecraft" },
   { id: "2", name: "theo.js", tag: "#9900", activity: "Coding in VS Code" },
];
const mockAll = [
   ...mockOnline,
   { id: "3", name: "luna_m", tag: "#0077", activity: null },
   { id: "4", name: "brecht", tag: "#5512", activity: null },
];

function AddFriendPanel() {
   return (
      <div className="flex flex-col gap-4 max-w-xl">
         <div>
            <h3 className="text-base font-semibold text-text-bright">Add Friend</h3>
            <p className="text-sm text-zinc-500 mt-0.5">
               You can add friends with their username.
            </p>
         </div>
         <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-bg-input border border-white/5 focus-within:border-discord-brand transition-colors">
            <input
               type="text"
               placeholder="Enter a username#0000"
               className="flex-1 bg-transparent outline-none text-sm text-zinc-200 placeholder:text-zinc-600"
            />
            <button className="px-3 py-1.5 rounded-md bg-discord-brand hover:bg-accent-blue text-white text-xs font-semibold transition-colors">
               Send Friend Request
            </button>
         </div>
      </div>
   );
}

export default function DirectMessagesPage() {
   return (
      <Tabs
         defaultValue="all"
         className="flex flex-col w-full h-screen bg-sidebar-secondary"
      >
         <div className="flex items-center gap-4 px-4 h-12 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2 text-zinc-200">
               <Users size={18} className="text-zinc-400" />
               <span className="text-sm font-semibold">Friends</span>
            </div>
            <div className="w-px h-5 bg-white/10" />
            <TabsList className="bg-sidebar-secondary">
               {tabs.map((t) => (
                  <TabsTrigger
                     key={t.id}
                     value={t.id}
                     className={cn(
                        "flex data-active:bg-discord-blue data-active:text-white items-center gap-1.5 px-3 py-1 rounded-md text-sm transition-colors hover:text-white",
                        t.label === "add"
                           ? "bg-green-500/20 text-green-400 font-medium"
                           : "text-green-400 hover:bg-green-500/10 font-medium",
                     )}
                  >
                     {t.id === "add" && t.icon}
                     {t.label}
                  </TabsTrigger>
               ))}
            </TabsList>
         </div>

         <TabsContent value="all" className="flex-1 overflow-y-auto px-4 py-4">
            <>
               <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                  All Friends — {mockAll.length}
               </p>
               <Suspense defer fallback={<p>Loading....</p>}>
                  <AllFriends />
               </Suspense>
            </>
         </TabsContent>

         <TabsContent value="pending" className="flex-1 overflow-y-auto px-4 py-4">
            <PendingRequests />
         </TabsContent>

         <TabsContent value="online" className="flex-1 overflow-y-auto px-4 py-4">
            <>
               <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                  Online — {mockOnline.length}
               </p>
            </>
         </TabsContent>

         <TabsContent value="add" className="flex-1 overflow-y-auto px-4 py-4">
            <AddFriendPanel />
         </TabsContent>
      </Tabs>
   );
}
