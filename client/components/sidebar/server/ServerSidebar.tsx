import {
  ChevronDown,
  Copy,
  Pen,
  UserPlus,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import InviteFriendDialog from "@/components/server/InviteFriendDialog"
import CreateChannel from "@/components/server/CreateChannel"
import ServerSettingDialog from "@/components/server/ServerSettingDialog"
import CreateCategoryDialog from "@/components/server/CreateCategoryDialog"
import Link from "next/link"
import ChannelList from "./ChannelList"
import { getAllChannel } from "@/lib/server/data/channels"

export default async function ServerSidebar({ serverId }: { serverId: string }) {
  const channels = await getAllChannel(serverId)

  return (
    <aside className="bg-overlay min-w-64 w-64 h-screen flex flex-col rounded-l-2xl">
      <header className="h-14 shrink-0 flex items-center px-5 border-b border-white/10 justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm capitalize font-medium text-white">
            {channels.server.name}
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <ChevronDown
                size={18}
                className="text-white text-sm cursor-pointer"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52 p-2 bg-sidebar-secondary shadow backdrop-blur-lg text-white space-y-3">
              <InviteFriendDialog />
              <CreateChannel serverID={serverId} />
              <ServerSettingDialog serverId={serverId} />
              <CreateCategoryDialog serverId={serverId} userId="usr_001" />
              <Link
                href="/"
                className="w-full p-1.5 text-sm rounded flex justify-between items-center hover:bg-sidebar-primary/15"
              >
                <p>Edit Per-server profile</p>
                <Pen size={20} />
              </Link>
              <button className="w-full p-1.5 text-sm rounded flex justify-between items-center hover:bg-sidebar-primary/15">
                <p>Copy server ID</p>
                <Copy size={20} />
              </button>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <button>
          <UserPlus size={20} className="text-white fill-white" />
        </button>
      </header>

      <div className="flex flex-col overflow-y-auto h-full">
        <ChannelList channels={channels} />
      </div>
    </aside>
  )
}
