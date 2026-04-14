import InviteCard, { type InviteInfo } from "./_components/InviteCard"
import { InviteExpired, InviteInvalid } from "./_components/InviteStates"

// TODO: replace with real fetch
async function getInviteInfo(code: string): Promise<InviteInfo | null> {
  // const res = await fetch(`${process.env.API_URL}/invitations/find?code=${code}`, { cache: "no-store" })
  // if (!res.ok) return null
  // const json = await res.json()
  // return json.data as InviteInfo

  return {
    code,
    server: {
      id: "server-1",
      name: "The Dev Lounge",
      icon: null,
      banner_color: "var(--color-discord-brand)",
      total_members: 1284,
      online_members: 312,
    },
    inviter: { username: "alexknight", avatar: null },
    uses: 8,
    max_users: 25,
    expired: false,
  }
}

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const invite = await getInviteInfo(code)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-base">
      {/* Radial glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${invite?.server.banner_color ?? "var(--color-discord-brand)"}88 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4 bg-surface-raised rounded-2xl p-8 shadow-2xl border border-surface-subtle flex flex-col items-center">
        {!invite ? (
          <InviteInvalid />
        ) : invite.expired ? (
          <InviteExpired code={code} />
        ) : (
          <InviteCard info={invite} />
        )}
      </div>
    </div>
  )
}
