import { isUserJoin } from "@/lib/server/data/members"
import InviteCard, { type InviteInfo } from "./_components/InviteCard"
import { InviteExpired, InviteInvalid } from "./_components/InviteStates"
import { redirect } from "next/navigation"
import { findInvitationByCode } from "@/lib/server/data/invitations"


export default async function InvitePage({ params, searchParams }: { params: Promise<{ code: string }>, searchParams: Promise<{ server_id: string }> }) {
  const param = await params
  const { server_id } = await searchParams
  const invite = await findInvitationByCode(param.code)
  const userId = "usr_002"

  if (!userId) {
    redirect("/sign-in")
  }

  if (invite && userId === invite.created_by) {
    redirect("/")
  }
  const joined = await isUserJoin(server_id, userId)

  if (joined) {
    redirect("/")
  }
  console.log(params)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-base">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${invite?.banner_color[0] ?? "var(--color-discord-brand)"}88 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4 bg-surface-raised rounded-2xl p-8 shadow-2xl border border-surface-subtle flex flex-col items-center">
        {!invite ? (
          <InviteInvalid />
        ) : (
          <InviteCard info={invite} joined={joined} code={param.code} user_id={userId} />
        )}
      </div>
    </div>
  )
}
