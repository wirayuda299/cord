'use client'

import { Settings } from "lucide-react"
import { DialogContent, Dialog, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"
import { cn } from "@/lib/utils"
import ServerProfile from "./profile"
import BoostPerks from "./BoostPerks"
import Members from "./Members"
import ServerRolesSettings from "./roles"
import Invites from "./Invites"
import SafetySetup from "./SafetySetup"
import AuditLog from "./AuditLog"
import Bans from "./Bans"


const sidebarItems = ["server profile", "boost perks", "members", "roles", "invites", "safety setup", "audit log", "bans", "delete server"] as const

export default function ServerSettingDialog() {
  const [active, setActive] = useState<typeof sidebarItems[number]>("server profile")
  return (
    <Dialog>
      <DialogTrigger className="w-full p-1.5 text-sm rounded flex justify-between items-center hover:bg-sidebar-primary/15">
        <p>Server setting</p>
        <Settings size={20} />
      </DialogTrigger>
      <DialogContent
        onKeyDown={(e) => e.stopPropagation()}
        className="min-w-full min-h-screen rounded-none bg-sidebar-primary p-0">
        <div className="flex gap-3">
          <aside className="min-w-52  border-r border-sidebar-secondary/25 p-3 text-white flex flex-col gap-3">
            <h3 className="font-semibold hover:text-white text-lg text-gray-400">Server name </h3>
            <ul className="flex flex-col gap-5 text-sm  font-medium text-gray-400">
              {sidebarItems.map(item => (
                <li
                  onClick={() => setActive(item)}
                  className={cn("hover:text-white cursor-pointer capitalize", active === item && "text-white")}
                  key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </aside>
          {active === "server profile" && <ServerProfile />}
          {active === "boost perks" && <BoostPerks />}
          {active === "members" && <Members />}
          {active === "roles" && <ServerRolesSettings />}
          {active === "invites" && <Invites />}
          {active === "safety setup" && <SafetySetup />}
          {active === "audit log" && <AuditLog />}
          {active === "bans" && <Bans />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
