import { ServerCrash } from "lucide-react"
import Link from "next/link"

export function InviteInvalid() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex items-center justify-center size-20 rounded-[1.75rem] bg-surface-hover border border-surface-subtle">
        <ServerCrash size={36} className="text-text-muted" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-text-bright">Invalid Invite</h2>
        <p className="text-sm text-text-dim mt-1.5">
          This invite link doesn&apos;t exist or has been revoked.
        </p>
      </div>
      <Link
        href="/direct-messages"
        className="mt-2 px-5 py-2.5 rounded-xl bg-surface-hover hover:bg-surface-subtle text-text-primary text-sm font-medium transition-colors"
      >
        Back to Home
      </Link>
    </div>
  )
}
