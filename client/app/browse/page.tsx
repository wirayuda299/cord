import { Compass } from 'lucide-react'
import { browseServers } from '@/lib/server/data/servers'
import ServerCard from './_components/ServerCard'

export default async function BrowsePage() {
  const servers = await browseServers('usr_001')

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface-base overflow-y-auto">
      <div className="bg-surface-raised border-b border-surface-hover px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-discord-brand/20">
              <Compass size={22} className="text-discord-brand" />
            </div>
            <h1 className="text-xl font-bold text-text-bright">Discover Servers</h1>
          </div>
          <p className="text-text-dim text-sm ml-12">
            Find public communities and join with one click.
          </p>
        </div>
      </div>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-5xl mx-auto">
          {servers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Compass size={48} className="text-text-muted opacity-20" />
              <p className="text-text-muted text-sm">No servers to discover yet.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-text-muted mb-4 uppercase tracking-widest font-medium">
                {servers.length} server{servers.length !== 1 ? 's' : ''} available
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {servers.map(server => (
                  <ServerCard key={server.id} server={server} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
