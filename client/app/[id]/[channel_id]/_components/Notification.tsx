import DropdownWrapper from "@/components/shared/DropdownWrapper";
import { Bell } from "lucide-react";

const notifications = Array.from({ length: 10 })
function NotificationItem() {
  return (
    <>
      <header className="flex items-center justify-between bg-sidebar-primary sticky top-0 h-10 px-3">
        <h2 className="text-sm font-semibold "> Notification </h2>
        <button className="text-xs text-blue-600 cursor-pointer lowercase"> mark all as read </button>
      </header>

      <ul className="flex flex-col gap-3 px-3">
        {notifications.map((_, index) => (
          <li key={index} className="flex items-center gap-2 py-2 hover:bg-sidebar-primary hover:brightness-125 rounded-md px-1 cursor-pointer">
            <div className="flex-1">
              <h3 className="flex text-xs items-center justify-between">
                <span> Sender name </span>
                <span className="text-gray-400"> 12:00 PM </span>
              </h3>
              <p className="font-medium text-gray-400 text-xs">
                message
              </p>
            </div>

          </li>
        ))}
      </ul>
    </>

  )
}

export default function Notification() {
  return (
    <DropdownWrapper
      style="min-w-80 bg-sidebar-primary text-gray-400 p-0 max-h-[300px]"
      icon={<Bell className="text-muted-foreground text-sm hover:text-white" />}>

      <NotificationItem />    </DropdownWrapper>
  )
}
