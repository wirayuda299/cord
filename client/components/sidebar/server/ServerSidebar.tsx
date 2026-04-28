import {
  ChevronDown,
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
import EditPerServerProfileDialog from "@/components/server/EditPerServerProfileDialog"
import ChannelList from "./ChannelList"
import { getAllChannel } from "@/lib/server/data/channels"
import CopyServerIDButton from "@/components/server/CopyServerIDButton"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import Invites from "@/components/server/Invites"

export default async function ServerSidebar({ serverId }: { serverId: string }) {
  const channels = await getAllChannel(serverId)
  const serverOwner = channels.server.created_by

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
              <ServerSettingDialog serverId={serverId} serverOwner={serverOwner} />
              <CreateCategoryDialog serverId={serverId} />
              <EditPerServerProfileDialog serverId={serverId} userId={serverOwner} />
              <CopyServerIDButton serverID={serverId} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Dialog>
          <DialogTrigger>
            <UserPlus size={20} className="text-white fill-white" />
          </DialogTrigger>
          <DialogContent className="min-w-full mx-auto bg-sidebar-primary">
            <Invites serverID={serverId} />
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex flex-col overflow-y-auto h-full">
        <ChannelList channels={channels} />
      </div>
    </aside>
  )
}
