'use client'

import { copyText } from "@/lib/clipboard"
import { Copy } from "lucide-react"
import { toast } from "@/components/ui/toast"


export default function CopyServerIDButton({ serverID }: { serverID: string }) {
  return (
    <button
      onClick={() => copyText(serverID, { onSuccess: () => toast.add({ title: "Server ID copied", type: "success" }) })}
      className="w-full p-1.5 text-xs font-medium md:font-normal md:text-sm rounded flex justify-between items-center hover:bg-sidebar-primary/15">
      <p>Copy server ID</p>
      <Copy size={20} />
    </button>
  )
}
