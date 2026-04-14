import { Switch } from "@/components/ui/switch"
import { UseFormReturn } from "react-hook-form"
import { RoleFormValues } from "./role-form-view"

const permissions = [
  {
    label: "view_channel",
    desc: "Allows members to view channels and read messages",
  },
  {
    label: "manage_channel",
    desc: "Allows members to create, edit, and delete channels",
  },
  {
    label: "manage_role",
    desc: "Allows members to create, edit, and delete roles below their own",
  },
  {
    label: "kick_member",
    desc: "Allows members to remove other members from the server",
  },
  {
    label: "ban_member",
    desc: "Allows members to permanently ban other members from the server",
  },
  {
    label: "attach_file",
    desc: "Allows members to upload files and images in text channels",
  },
  {
    label: "manage_thread",
    desc: "Allows members to create, edit, and delete threads in channels",
  },
  {
    label: "manage_message",
    desc: "Allows members to delete and pin messages from other members",
  },
]

export default function PermissionsTab({
  form,
}: {
  form: UseFormReturn<RoleFormValues>
}) {

  const existing = form.watch("permissions")
  const toggle = (id: string) => {

    const found = existing.find(p => p === id)
    if (found) {
      form.setValue("permissions", existing.filter(p => p !== id))
    } else {
      const newPerm = [...existing, id]
      form.setValue("permissions", newPerm)

    }
  }


  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-white/30">
        1 of 8 permissions enabled
      </p>
      {permissions.map((perm) => (
        <div
          onClick={() => toggle(perm.label)}
          key={perm.label}
          className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors"
        >
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-white leading-tight capitalize">
              {perm.label.split("_").join("  ")}
            </p>
            <p className="text-xs">
              {perm.desc}
            </p>
          </div>
          <Switch
            className="data-unchecked:bg-sidebar-primary data-checked:bg-discord-blue shadow shrink-0"
            checked={!!existing?.find(p => p === perm.label)}
          />
        </div>
      ))}
    </div>
  )
}
