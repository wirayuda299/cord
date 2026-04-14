'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronLeft, ImageIcon, Loader2, Palette, Shield } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import SaveBar from "./save-bar"
import { createRole } from "@/lib/server/actions/role"
import { updateRole } from "@/lib/server/actions/role"
import { Role } from "@/lib/types/role"
import { useParams } from "next/navigation"
import { PERMISSION_LIST } from "@/constants/permissions"
import { ROLE_COLORS } from "@/constants/role"


const roleFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Max 50 characters"),
  role_color: z.string().max(20),
  icon: z.string().max(255).nullable(),
  hoist: z.boolean(),
  mentionable: z.boolean(),
  permissions: z.array(z.string()),
})

export type RoleFormValues = z.infer<typeof roleFormSchema>


type CreateProps = {
  mode: "create"
  onBack: () => void
}

type EditProps = {
  mode: "edit"
  role: Role
  initialPermissions: string[]
  onBack: () => void
}

type Props = CreateProps | EditProps


export default function RoleFormView(props: Props) {
  const { mode, onBack } = props
  const params = useParams()

  const [activeTab, setActiveTab] = useState<"display" | "permissions">("display")
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: mode === "edit"
      ? {
        name: props.role.name,
        role_color: props.role.color ?? "#99aab5",
        icon: props.role.icon || null,
        hoist: props.role.hoist,
        mentionable: props.role.mentionable,
        permissions: props.initialPermissions,
      }
      : {
        name: "",
        role_color: "#99aab5",
        icon: null,
        hoist: false,
        mentionable: false,
        permissions: [],
      },
    mode: "onChange",
  })

  const { isDirty, isSubmitting, errors } = form.formState
  const color = form.watch("role_color")
  const icon = form.watch("icon")
  const nameValue = form.watch("name")
  const existing = form.watch("permissions")

  const togglePermission = (id: string) => {
    const next = existing.includes(id)
      ? existing.filter((p) => p !== id)
      : [...existing, id]
    form.setValue("permissions", next, { shouldDirty: true })
  }

  const onSubmit = async (values: RoleFormValues) => {
    setStatus(null)

    if (mode === "create") {
      try {
        await createRole({
          name: values.name,
          server_id: params.id as string,
          color: values.role_color,
          icon: values.icon ?? "",
          hoist: values.hoist,
          mentionable: values.mentionable,
          permission_ids: values.permissions,
        })
        form.reset()
        onBack()
      } catch (e) {
        setStatus({ type: "error", message: String(e) })
      }
      return
    }

    const res = await updateRole({
      role_id: props.role.id,
      name: values.name,
      color: values.role_color,
      icon: values.icon ?? "",
      hoist: values.hoist,
      mentionable: values.mentionable,
      permission_ids: values.permissions,
    })
    if (res?.error) {
      setStatus({ type: "error", message: res.error })
    } else {
      setStatus({ type: "success", message: "Role updated!" })
      form.reset(values)
    }
  }

  const tabs = [
    { id: "display" as const, label: "Display", icon: <Palette size={13} /> },
    { id: "permissions" as const, label: "Permissions", icon: <Shield size={13} /> },
  ]

  return (
    <div className="flex flex-col w-full max-h-screen overflow-hidden text-white">
      <div className="px-8 pt-6 pb-0 shrink-0 border-b border-white/5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-5 transition-colors"
        >
          <ChevronLeft size={15} />
          Back to Roles
        </button>

        {mode === "edit" ? (
          <div className="flex items-center gap-3 mb-4">
            {icon ? (
              <img src={icon} alt="" className="size-8 rounded-full object-cover border border-white/10 shrink-0" />
            ) : (
              <span
                className="size-8 rounded-full shrink-0 border-2 border-white/10"
                style={{ backgroundColor: color }}
              />
            )}
            <div>
              <h1 className="text-xl font-semibold text-white leading-tight">
                Edit — {props.role.name}
              </h1>
              <p className="text-xs font-mono text-white/25 mt-px">{props.role.id}</p>
            </div>
          </div>
        ) : (
          <h1 className="text-xl font-semibold text-white mb-4">Create role</h1>
        )}

        <div className="flex items-center gap-1 border-b border-white/5 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px",
                activeTab === tab.id
                  ? "border-[#5865f2] text-white"
                  : "border-transparent text-white/40 hover:text-white/70"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">

          {activeTab === "display" && (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-widest text-white/40">
                    Role Name
                  </label>
                  <span className="text-xs text-white/20">{nameValue.length} / 50</span>
                </div>
                <Input
                  autoComplete="off"
                  {...form.register("name")}
                  placeholder="new role"
                  className={cn(
                    "bg-white/5 text-white text-sm rounded-lg",
                    errors.name
                      ? "border-red-500/60 focus:border-red-500"
                      : "border-white/10 focus:border-white/25"
                  )}
                />
                {errors.name && (
                  <p className="text-xs text-red-400">{errors.name.message}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  {icon ? (
                    <img src={icon} alt="" className="size-2.5 rounded-full object-cover shrink-0" />
                  ) : (
                    <span
                      className="size-2.5 rounded-full shrink-0 transition-colors"
                      style={{ backgroundColor: color }}
                    />
                  )}
                  <span className="text-xs text-white/40 truncate">{nameValue || "new role"}</span>
                </div>
              </div>

              {/* Color */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-widest text-white/40">
                    Role Color
                  </label>
                  <span className="text-xs text-white/25 font-mono">{color}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {ROLE_COLORS.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => form.setValue("role_color", c, { shouldDirty: true })}
                      className={cn(
                        "size-7 rounded-full transition-all border-2",
                        color === c ? "border-white scale-110" : "border-transparent hover:scale-110"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon URL */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  Icon URL
                  <span className="ml-2 normal-case tracking-normal font-normal text-white/25">
                    (optional)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  {icon ? (
                    <img
                      src={icon}
                      alt=""
                      className="size-8 rounded-full object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <ImageIcon size={13} className="text-white/30" />
                    </div>
                  )}
                  <Input
                    {...form.register("icon")}
                    placeholder="https://example.com/icon.png"
                    className="bg-white/5 text-white text-sm rounded-lg border-white/10 focus:border-white/25 flex-1"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  Options
                </label>
                <Controller
                  control={form.control}
                  name="hoist"
                  render={({ field }) => (
                    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/3 border border-white/5">
                      <div>
                        <p className="text-sm font-medium text-white">Display separately</p>
                        <p className="text-xs text-white/35 mt-0.5 leading-relaxed">
                          Members with this role appear in their own group
                        </p>
                      </div>
                      <Switch
                        className="data-unchecked:bg-sidebar-primary data-checked:bg-discord-blue shadow shrink-0 mt-0.5"
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />
                <Controller
                  control={form.control}
                  name="mentionable"
                  render={({ field }) => (
                    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/3 border border-white/5">
                      <div>
                        <p className="text-sm font-medium text-white">Allow @mention</p>
                        <p className="text-xs text-white/35 mt-0.5 leading-relaxed">
                          Anyone can @mention this role to notify all members
                        </p>
                      </div>
                      <Switch
                        className="data-unchecked:bg-sidebar-primary data-checked:bg-discord-blue shadow shrink-0 mt-0.5"
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />
              </div>
            </>
          )}

          {/* Permissions tab */}
          {activeTab === "permissions" && (
            <div className="flex flex-col gap-6">
              <p className="text-xs text-white/30">
                {existing.length} of {PERMISSION_LIST.length} permissions enabled
              </p>
              {PERMISSION_LIST.map((perm) => (
                <div
                  key={perm.label}
                  onClick={() => togglePermission(perm.label)}
                  className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-white leading-tight capitalize">
                      {perm.label.split("_").join("  ")}
                    </p>
                    <p className="text-xs text-white/35">{perm.desc}</p>
                  </div>
                  <Switch
                    className="data-unchecked:bg-sidebar-primary data-checked:bg-discord-blue shadow shrink-0"
                    checked={!!existing.includes(perm.label)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer: create = explicit buttons, edit = SaveBar ─────────── */}
        {mode === "create" ? (
          <div className="shrink-0 border-t border-white/5 px-8 py-4">
            {status?.type === "error" && (
              <p className="text-xs text-red-400 mb-3">{status.message}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                className="text-white/50 hover:text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#5865f2] hover:bg-[#4752c4] text-white disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 size={12} className="animate-spin" />}
                {isSubmitting ? "Creating…" : "Create role"}
              </Button>
            </div>
          </div>
        ) : (
          <SaveBar
            isDirty={isDirty}
            isSubmitting={isSubmitting}
            status={status}
            onReset={() => {
              form.reset()
              setStatus(null)
            }}
          />
        )}
      </form>
    </div>
  )
}
