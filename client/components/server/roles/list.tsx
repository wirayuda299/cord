import { getAllRoles } from "@/lib/client/api/roles"
import { Role } from "@/lib/types/role"
import { cn } from "@/lib/utils"
import { GripVertical, Plus } from "lucide-react"
import { useParams } from "next/navigation"
import useSWR from "swr"

type Props = {
  selectedId: string | null
  onSelect: (id: string, role: Role) => void
  onCreateClick: () => void
  memberCounts: Record<string, number>
}

export default function RoleList({
  selectedId,
  onSelect,
  onCreateClick,
  memberCounts,
}: Props) {
  const params = useParams()
  const { data: roles, isLoading, mutate } = useSWR("/api/roles", () => getAllRoles(params.id as string))
  return (
    <phantom-ui loading={isLoading}>
      <div className="w-52 shrink-0 border-r border-white/5 flex flex-col h-screen">
        <div className="px-3 pt-6 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
              Roles
            </p>
            <span className="text-xs text-white/20">{roles?.length}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onCreateClick()
              mutate()
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-colors"
          >
            <Plus size={13} />
            Create Role
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
          {roles && roles.length === 0 && (
            <p className="text-xs text-white/25 px-3 py-4 text-center">
              No roles yet.
            </p>
          )}
          {roles?.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => onSelect(role.id, role)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors group",
                selectedId === role.id
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              )}
            >
              <GripVertical
                size={12}
                className="text-white/20 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              />
              {role.icon ? (
                <img
                  src={role.icon}
                  alt=""
                  className="size-3 rounded-full shrink-0 object-cover"
                />
              ) : (
                <span
                  className="size-3 rounded-full shrink-0"
                  style={{ backgroundColor: role.color ?? "#99aab5" }}
                />
              )}
              <span className="flex-1 truncate text-sm">{role.name}</span>
              {(memberCounts[role.id] ?? 0) > 0 && (
                <span className="text-[10px] text-white/25 shrink-0">
                  {memberCounts[role.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </phantom-ui>
  )
}
