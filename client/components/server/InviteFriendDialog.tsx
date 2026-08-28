import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Users } from "lucide-react";
import FriendList from "@/components/members/FriendList";
import { getAllFriends } from "@/lib/server/data/friends";
import type { FriendListItem } from "@/lib/types/friends";

export default async function InviteFriendDialog({
   serverId,
}: {
   serverId: string;
}) {
   let friends: FriendListItem[] = [];
   try {
      friends = await getAllFriends();
   } catch {
      friends = [];
   }

   return (
      <Dialog>
         <DialogTrigger className="w-full p-1.5 text-xs font-medium md:font-normal md:text-sm rounded flex justify-between items-center hover:bg-sidebar-primary/15">
            <p>Invite user</p>
            <Users size={20} />
         </DialogTrigger>
         <DialogContent className="p-0 bg-sidebar-primary rounded-2xl">
            <FriendList serverId={serverId} friends={friends} />
         </DialogContent>
      </Dialog>
   );
}
