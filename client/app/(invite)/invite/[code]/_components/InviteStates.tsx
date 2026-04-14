import { ShieldAlert, ServerCrash, Loader2 } from "lucide-react"

export function InviteLoading() {
  return (
    <div className="py-12 flex flex-col items-center gap-3 text-text-muted">
      <Loader2 size={28} className="animate-spin" />
      <p className="text-sm">Loading invite…</p>
    </div>
  )
}

export function InviteExpired({ code }: { code: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex items-center justify-center size-20 rounded-[1.75rem] bg-destructive/10 border border-destructive/20">
        <ShieldAlert size={36} className="text-destructive" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-text-bright">Invite Expired</h2>
        <p className="text-sm text-text-dim mt-1.5 max-w-xs leading-relaxed">
          Invite <span className="font-mono text-text-muted">{code}</span> has expired or reached its maximum uses.
        </p>
      </div>
      <a
        href="/"
        className="mt-2 px-5 py-2.5 rounded-xl bg-surface-hover hover:bg-surface-subtle text-text-primary text-sm font-medium transition-colors"
      >
        Back to Home
      </a>
    </div>
  )
}

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
      <a
        href="/"
        className="mt-2 px-5 py-2.5 rounded-xl bg-surface-hover hover:bg-surface-subtle text-text-primary text-sm font-medium transition-colors"
      >
        Back to Home
      </a>
    </div>
  )
}
