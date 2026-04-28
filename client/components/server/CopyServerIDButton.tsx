'use client'

import { copyText } from "@/lib/client/clipboard"
import { Copy } from "lucide-react"


export default function CopyServerIDButton({ serverID }: { serverID: string }) {

  return (

    <button
      onClick={() => copyText(serverID, { onSuccess: () => alert("Server ID copied") })}
      className="w-full p-1.5 text-sm rounded flex justify-between items-center hover:bg-sidebar-primary/15">
      <p>Copy server ID</p>
      <Copy size={20} />
    </button>
  )
}
