'use client'

import { cn } from "@/lib/utils"
import { ChevronLeft, ImageIcon, Palette, Pencil, Shield, Users } from "lucide-react"
import { useState } from "react"
import MembersTab from "./members"
import { Role } from "@/lib/types/role"
import useSWR from "swr"
import { findPermissionByRoleId } from "@/lib/client/api/permissions"
import { PERMISSION_LIST } from "@/constants/permissions"

type Tab = "display" | "permissions" | "members"


function ReadOnlyToggle({ label, description, value }: {
  label: string
  description: string
  value: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/3 border border-white/5">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-white/35 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <div
        className={cn(
          "mt-0.5 shrink-0 h-5 w-9 rounded-full flex items-center px-0.5 transition-colors",
          value ? "bg-discord-blue" : "bg-white/10"
        )}
      >
        <div
          className={cn(
            "size-4 rounded-full bg-white shadow transition-transform",
            value ? "translate-x-4" : "translate-x-0"
          )}
        />
      </div>
    </div>
  )
}


function DisplayTab({ role }: { role: Role }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Name + color */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-white/40">
          Role Name
        </label>
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10">
          {role.icon ? (
            <img src={role.icon} alt="" className="size-3 rounded-full object-cover shrink-0" />
          ) : (
            <span
              className="size-3 rounded-full shrink-0"
              style={{ backgroundColor: role.color ?? "#99aab5" }}
            />
          )}
          <span className="text-sm text-white">{role.name}</span>
        </div>
      </div>

      {/* Color swatch */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-white/40">
          Role Color
        </label>
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/5 border border-white/10">
          <span
            className="size-7 rounded-full border-2 border-white/20 shrink-0"
            style={{ backgroundColor: role.color ?? "#99aab5" }}
          />
          <span className="text-sm font-mono text-white/60">{role.color ?? "#99aab5"}</span>
        </div>
      </div>

      {/* Icon */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-white/40">
          Icon
        </label>
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/5 border border-white/10">
          {role.icon ? (
            <img
              src={role.icon}
              alt=""
              className="size-8 rounded-full object-cover border border-white/10 shrink-0"
            />
          ) : (
            <div className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <ImageIcon size={13} className="text-white/30" />
            </div>
          )}
          <span className="text-sm text-white/40">{role.icon || "No icon"}</span>
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-white/40">
          Options
        </label>
        <ReadOnlyToggle
          label="Display separately"
          description="Members with this role appear in their own group"
          value={role.hoist}
        />
        <ReadOnlyToggle
          label="Allow @mention"
          description="Anyone can @mention this role to notify all members"
          value={role.mentionable}
        />
      </div>
    </div>
  )
}


function PermissionsTab({ permissionIds }: { permissionIds: string[] }) {
  const enabledSet = new Set(permissionIds)
  const enabledCount = PERMISSION_LIST.filter((p) => enabledSet.has(p.label)).length

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-white/30">
        {enabledCount} of {PERMISSION_LIST.length} permissions enabled
      </p>
      {PERMISSION_LIST.map((perm) => {
        const on = enabledSet.has(perm.label)
        return (
          <div
            key={perm.label}
            className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-white/3 border border-white/5"
          >
            <div className="min-w-0 space-y-1">
              <p className={cn("text-sm font-medium leading-tight capitalize", on ? "text-white" : "text-white/40")}>
                {perm.label.split("_").join("  ")}
              </p>
              <p className="text-xs text-white/30">{perm.desc}</p>
            </div>
            <div
              className={cn(
                "shrink-0 h-5 w-9 rounded-full flex items-center px-0.5 transition-colors",
                on ? "bg-[#5865f2]" : "bg-white/10"
              )}
            >
              <div
                className={cn(
                  "size-4 rounded-full bg-white shadow transition-transform",
                  on ? "translate-x-4" : "translate-x-0"
                )}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}


export default function RoleDetailView({
  role,
  onBack,
  onEdit,
}: {
  role: Role
  onBack: () => void
  onEdit: (permissions: string[]) => void
}) {
  const { data, isLoading } = useSWR("/api/permission", () => findPermissionByRoleId(role.id))
  const [activeTab, setActiveTab] = useState<Tab>("display")

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "display", label: "Display", icon: <Palette size={13} /> },
    { id: "permissions", label: "Permissions", icon: <Shield size={13} /> },
    { id: "members", label: "Members", icon: <Users size={13} /> },
  ]


  return (
    <phantom-ui loading={isLoading}>
      <div className="flex flex-col grow w-full max-h-screen overflow-hidden text-white">
        <div className="px-8 pt-6 pb-0 shrink-0 border-b border-white/5">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-5 transition-colors"
          >
            <ChevronLeft size={15} />
            Back to Roles
          </button>

          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              {role.icon ? (
                <img src={role.icon} alt="" className="size-8 rounded-full object-cover border border-white/10 shrink-0" />
              ) : (
                <span
                  className="size-8 rounded-full shrink-0 border-2 border-white/10"
                  style={{ backgroundColor: role.color ?? "#99aab5" }}
                />
              )}
              <div>
                <h1 className="text-xl font-semibold text-white leading-tight">{role.name}</h1>
                <p className="text-xs font-mono text-white/25 mt-px">{role.id}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEdit(data?.permissions ?? [])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all"
            >
              <Pencil size={12} />
              Edit Role
            </button>
          </div>

          {/* Tabs */}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {activeTab === "display" && <DisplayTab role={role} />}
          {activeTab === "permissions" && <PermissionsTab permissionIds={data?.permissions || []} />}
          {activeTab === "members" && <MembersTab userRows={[]} />}
        </div>
      </div>
    </phantom-ui>
  )
}
