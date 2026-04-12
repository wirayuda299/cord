import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Users } from "lucide-react";
import FriendList from "@/components/members/FriendList";

export default function InviteFriendDialog() {
   return (
      <Dialog>
         <DialogTrigger className="w-full p-1.5 text-sm rounded flex justify-between items-center hover:bg-sidebar-primary/15">
            <p>Invite user</p>
            <Users size={20} />
         </DialogTrigger>
         <DialogContent className="p-0 bg-sidebar-primary rounded-2xl">
            <FriendList />
         </DialogContent>
      </Dialog>
   );
}
