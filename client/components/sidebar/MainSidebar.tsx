import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Compass, MessageCircle } from "lucide-react"

import { getAllServers } from "@/lib/queries/servers"
import { cn } from "@/lib/utils"

const CreateServerForm = dynamic(() => import("@/components/server/CreateServerForm"))

export default async function MainSidebar() {

  const servers = await getAllServers()

  return (
    <aside className="flex gap-5 min-w-20 flex-col items-center min-h-screen w-20 max-h-screen p-3 bg-overlay overflow-y-auto ">
      <Link
        href="/direct-messages"
        className="flex items-center justify-center w-12 h-12 min-h-12 bg-(--server-item) transition-all duration-300 rounded-full hover:bg-discord-blue"
      >
         <MessageCircle className="text-white" size={20}/>
      </Link>
      <ul className="space-y-4">
        {servers?.map((server) => (
          <li key={server.id}>
            <Link
              className={cn("flex group items-center justify-center w-12 h-12 bg-(--server-item) transition-all duration-300 cursor-pointer rounded-[50%]  hover:rounded-[20%]", !server.logo ? "hover:bg-discord-blue" : "")}
              href={`/${server.id}?name=${server.name}`}
            >
              {server.logo ? (
                <Image
                  src={server.logo}
                  width={28}
                  height={28}
                  alt={server.name}
                  className="object-cover size-full rounded-[50%]  group-hover:rounded-[20%] transition-all duration-300"
                  loading="lazy"
                />
              ) : (
                <p className="flex items-center justify-center size-12 text-base text-white rounded-full">
                  {server.name.slice(0, 1)}
                </p>
              )}
            </Link>
          </li>
        ))}

        <CreateServerForm />

        <Link
          href="/browse"
          title="Discover Servers"
          className="flex items-center justify-center w-12 h-12 min-h-12 bg-(--server-item) transition-all duration-500 rounded-[50%] hover:rounded-[20%] hover:bg-(--discord-green)"
        >
          <Compass className="size-5 text-white" />
        </Link>

      </ul>
    </aside>
  )
}
