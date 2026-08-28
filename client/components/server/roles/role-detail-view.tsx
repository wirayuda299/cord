"use client"

import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  ChevronLeft,
  ImageIcon,
  Loader2,
  Palette,
  Pencil,
  Shield,
  Trash,
  Users,
  X,
} from "lucide-react"
import { useState } from "react"
import MembersTab from "./members"
import { Role } from "@/lib/types/role"
import useSWR from "swr"
import { findPermissionByRoleId } from "@/lib/client/api/permissions"
import { deleteRole } from "@/lib/client/api/roles"
import { PERMISSIONS } from "@/constants/permissions"
import { useAuth } from "@clerk/nextjs"
import Image from "next/image";

type Tab = "display" | "permissions" | "members"

function ReadOnlyToggle({
  label,
  description,
  value,
}: {
  label: string
  description: string
  value: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/3 border border-white/5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-white/35 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <div
        className={cn(
          "mt-0.5 shrink-0 h-5 w-9 rounded-full flex items-center px-0.5 transition-colors",
          value ? "bg-discord-blue" : "bg-white/10",
        )}
      >
        <div
          className={cn(
            "size-4 rounded-full bg-white shadow transition-transform",
            value ? "translate-x-4" : "translate-x-0",
          )}
        />
      </div>
    </div>
  )
}

function DisplayTab({ role }: { role: Role }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-white/40">
          Role Name
        </label>
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10">
          {role.icon ? (
            <Image width={12} height={12} src={role.icon} alt="" className="size-3 rounded-full object-cover shrink-0" />
          ) : (
            <span
              className="size-3 rounded-full shrink-0"
              style={{ backgroundColor: role.color ?? "#99aab5" }}
            />
          )}
          <span className="text-sm text-white truncate">{role.name}</span>
        </div>
      </div>

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

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-white/40">
          Icon
        </label>
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/5 border border-white/10">
          {role.icon ? (
            <Image
              width={32}
              height={32}
              src={role.icon}
              alt=""
              className="size-8 rounded-full object-cover border border-white/10 shrink-0"
            />
          ) : (
            <div className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <ImageIcon size={13} className="text-white/30" />
            </div>
          )}
          <span className="text-sm text-white/40 truncate">{role.icon || "No icon"}</span>
        </div>
      </div>

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
  const enabledCount = PERMISSIONS.filter((p) => enabledSet.has(p.label)).length

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-white/30">
        {enabledCount} of {PERMISSIONS.length} permissions enabled
      </p>
      {PERMISSIONS.map((perm) => {
        const on = enabledSet.has(perm.label)
        return (
          <div
            key={perm.label}
            className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-white/3 border border-white/5"
          >
            <div className="min-w-0 space-y-1">
              <p
                className={cn(
                  "text-sm font-medium leading-tight capitalize",
                  on ? "text-white" : "text-white/40",
                )}
              >
                {perm.label.split("_").join("  ")}
              </p>
              <p className="text-xs text-white/30">{perm.desc}</p>
            </div>
            <div
              className={cn(
                "shrink-0 h-5 w-9 rounded-full flex items-center px-0.5 transition-colors",
                on ? "bg-[#5865f2]" : "bg-white/10",
              )}
            >
              <div
                className={cn(
                  "size-4 rounded-full bg-white shadow transition-transform",
                  on ? "translate-x-4" : "translate-x-0",
                )}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4 animate-pulse" aria-hidden="true">
      <div className="h-6 w-40 rounded bg-white/5" />
      <div className="h-20 w-full rounded-xl bg-white/5" />
      <div className="h-20 w-full rounded-xl bg-white/5" />
      <div className="h-20 w-full rounded-xl bg-white/5" />
    </div>
  )
}

type RoleDetailViewProps = {
  role: Role
  onBack: () => void
  onEdit: (permissions: string[]) => void
  onDeleted?: () => void
  serverOwner: string
  serverID: string
}

export default function RoleDetailView({
  role,
  onBack,
  onEdit,
  onDeleted,
  serverOwner,
  serverID,
}: RoleDetailViewProps) {
  const { getToken } = useAuth()
  const { data, isLoading } = useSWR(role.id ? ["/api/permission", role.id] : null, async () => {
    const token = await getToken()
    return await findPermissionByRoleId(role.id, token)
  })
  const [activeTab, setActiveTab] = useState<Tab>("display")
  const [deleteState, setDeleteState] = useState<"idle" | "confirm" | "deleting" | "error">("idle")
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "display", label: "Display", icon: <Palette size={13} /> },
    { id: "permissions", label: "Permissions", icon: <Shield size={13} /> },
    { id: "members", label: "Members", icon: <Users size={13} /> },
  ]

  const handleDelete = async () => {
    setDeleteState("deleting")
    setDeleteError(null)
    try {
      await deleteRole(role.id, serverID)
      onDeleted?.() ?? onBack()
    } catch (e) {
      setDeleteState("error")
      setDeleteError(e instanceof Error ? e.message : "Failed to delete role. Please try again.")
    }
  }

  return (
    <div className="flex flex-col w-full h-full max-h-full overflow-hidden text-white">
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-0 shrink-0 border-b border-white/5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-5 transition-colors"
        >
          <ChevronLeft size={15} />
          Back to Roles
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {role.icon ? (
              <Image
                src={role.icon}
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-full object-cover border border-white/10 shrink-0"
              />
            ) : (
              <span
                className="size-8 rounded-full shrink-0 border-2 border-white/10"
                style={{ backgroundColor: role.color ?? "#99aab5" }}
              />
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-white leading-tight truncate">
                {role.name}
              </h1>
              <p className="text-xs font-mono text-white/25 mt-px truncate">{role.id}</p>
            </div>
          </div>

          {deleteState === "confirm" || deleteState === "deleting" || deleteState === "error" ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5">
              {deleteState === "error" ? (
                <>
                  <AlertTriangle size={13} className="text-red-400 shrink-0" />
                  <span className="text-xs text-red-400">{deleteError}</span>
                  <button
                    type="button"
                    onClick={() => setDeleteState("idle")}
                    className="text-xs text-white/40 hover:text-white ml-1"
                  >
                    Dismiss
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs text-white/70">Delete this role?</span>
                  <button
                    type="button"
                    disabled={deleteState === "deleting"}
                    onClick={handleDelete}
                    className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    {deleteState === "deleting" && <Loader2 size={11} className="animate-spin" />}
                    {deleteState === "deleting" ? "Deleting…" : "Confirm"}
                  </button>
                  <button
                    type="button"
                    disabled={deleteState === "deleting"}
                    onClick={() => setDeleteState("idle")}
                    className="text-xs text-white/40 hover:text-white disabled:opacity-50"
                  >
                    <X size={13} />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(data?.permissions ?? [])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all"
              >
                <Pencil size={12} />
                <span className="hidden sm:inline">Edit Role</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteState("confirm")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all"
              >
                <Trash size={12} />
                <span className="hidden sm:inline">Delete Role</span>
              </button>
            </div>
          )}
        </div>

        <div
          role="tablist"
          className="flex items-center gap-1 border-b border-white/5 -mb-px overflow-x-auto"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px whitespace-nowrap",
                activeTab === tab.id
                  ? "border-[#5865f2] text-white"
                  : "border-transparent text-white/40 hover:text-white/70",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && activeTab === "permissions" ? (
        <DetailSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === "display" && <DisplayTab role={role} />}
          {activeTab === "permissions" && (
            <PermissionsTab permissionIds={data?.permissions || []} />
          )}
          {activeTab === "members" && (
            <MembersTab role={role} serverOwner={serverOwner} serverID={role.server_id} />
          )}
        </div>
      )}
    </div>
  )
}
