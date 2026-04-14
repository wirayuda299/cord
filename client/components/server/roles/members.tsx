import { Users } from "lucide-react"


type UserRow = {
  user_id: string
  display_name: string | null
  avatar_url: string | null
}
export default function MembersTab({ userRows }: { userRows: UserRow[] }) {
  if (userRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/25 gap-2">
        <Users size={32} className="opacity-40" />
        <p className="text-sm">No members have this role</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-white/30 mb-3">
        {userRows.length} member{userRows.length !== 1 ? "s" : ""}
      </p>
      {userRows.map((u) => {
        const initials = (u.display_name ?? u.user_id)
          .split(" ")
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase() ?? "")
          .join("")
        return (
          <div
            key={u.user_id}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/3 border border-white/5"
          >
            {u.avatar_url ? (
              <img
                src={u.avatar_url}
                alt=""
                className="size-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="size-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white/60 shrink-0">
                {initials || "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {u.display_name ?? u.user_id}
              </p>
              <p className="text-xs text-white/30 truncate font-mono">{u.user_id}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
