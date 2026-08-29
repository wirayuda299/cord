import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PendingRequests from "@/components/friends/PendingRequests";
import { Users, UserCheck, Clock, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import AllFriends from "@/components/friends/AllFriends";
import { Suspense } from "react";
import AddFriendPanel from "@/components/friends/AddFriendPanel";
import { auth } from "@clerk/nextjs/server";
import { Spinner } from "@/components/ui/spinner";
import OpenConversationsButton from "@/components/direct-messages/OpenConversationsButton";

type Tab = "online" | "all" | "pending" | "add";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "online", label: "Online", icon: <Users size={16} /> },
  { id: "all", label: "All", icon: <UserCheck size={16} /> },
  { id: "pending", label: "Pending", icon: <Clock size={16} /> },
  { id: "add", label: "Add Friend", icon: <UserPlus size={16} /> },
];


export default async function DirectMessagesPage() {
  const { userId } = await auth.protect()

  return (
    <Tabs
      defaultValue="all"
      className="flex flex-col w-full h-dvh bg-sidebar-secondary"
    >
      <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4 h-12 border-b border-white/5 shrink-0 overflow-x-auto">
        <OpenConversationsButton />
        <div className="flex items-center gap-2 text-zinc-200 shrink-0">
          <Users size={18} className="text-zinc-400" />
          <span className="text-sm font-semibold hidden sm:inline">Friends</span>
        </div>
        <div className="w-px h-5 bg-white/10 shrink-0" />
        <TabsList className="bg-sidebar-secondary shrink-0">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className={cn(
                "flex data-active:bg-discord-blue data-active:text-white items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-xs sm:text-sm whitespace-nowrap transition-colors hover:text-white",
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

      <TabsContent value="all" className="flex-1 overflow-y-auto px-3 sm:px-4 py-4">
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
            All Friends
          </p>
          <Suspense defer fallback={<Spinner className="mt-4" />}>
            <AllFriends />
          </Suspense>
        </>
      </TabsContent>

      <TabsContent value="pending" className="flex-1 overflow-y-auto px-3 sm:px-4 py-4">
        <PendingRequests currentUser={userId} />
      </TabsContent>

      <TabsContent value="online" className="flex-1 overflow-y-auto px-3 sm:px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
          Online
        </p>
        <Suspense defer fallback={<Spinner className="mt-4" />}>
          <AllFriends filter="online" />
        </Suspense>
      </TabsContent>

      <TabsContent value="add" className="flex-1 overflow-y-auto px-3 sm:px-4 py-4">
        <AddFriendPanel />
      </TabsContent>
    </Tabs>
  );
}
