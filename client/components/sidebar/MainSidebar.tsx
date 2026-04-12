import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"

import { getAllServers } from "@/lib/server/data/servers"

const CreateServerForm = dynamic(() => import("@/components/server/CreateServerForm"))

export default async function MainSidebar() {
  const userId = "usr_001"

  const servers = await getAllServers(userId)

  return (
    <aside className="flex gap-5 min-w-20 flex-col items-center min-h-screen w-20 max-h-screen p-3 bg-overlay overflow-y-auto ">
      <Link
        href="/direct-messages"
        className="flex items-center justify-center w-12 h-12 min-h-12 bg-(--server-item) transition-all duration-500 rounded-md hover:bg-discord-blue"
      >
        <Image className="size-7" src="/vercel.svg" width={28} height={28} alt="logo" />
      </Link>
      <phantom-ui loading={!servers}>
        <ul className="space-y-4">
          {servers?.map((server) => (
            <li key={server.id}>
              <Link
                className="flex items-center justify-center w-12 h-12 bg-(--server-item) transition-all duration-300 cursor-pointer rounded-[50%] hover:bg-discord-blue hover:rounded-[20%]"
                href={`/${server.id}?name=${server.name}`}
              >
                {server.logo ? (
                  <Image
                    src={server.logo}
                    width={28}
                    height={28}
                    alt={server.name}
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
        </ul>
      </phantom-ui>
    </aside>
  )
}
