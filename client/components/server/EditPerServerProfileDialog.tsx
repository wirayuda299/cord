'use client'

import { Check, Loader2, Pen, UserCircle2, X } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import Image from "next/image"
import useSWR from "swr"
import { useAttachedFiles } from "@/hooks/useAttachedFiles"
import { uploadImage } from "@/lib/server/actions/images"
import { updateServerProfile } from "@/lib/server/actions/serverProfile"
import { getServerProfile } from "@/lib/client/api/serverProfile"
import { updateServerProfileSchema, UpdateServerProfileType } from "@/lib/validation/serverProfile"
import { Input } from "@/components/ui/input"
import { ALLOWED_FILE_EXTENSIONS } from "@/lib/shared/file-validation"
import { cn } from "@/lib/utils"


function ProfileCard({ username, avatar, bio }: { username: string; avatar: string; bio: string }) {
  return (
    <div className="rounded-2xl overflow-hidden w-full bg-[#111214] shadow-2xl ring-1 ring-white/10">
      <div
        className="h-15"
        style={{ background: "linear-gradient(135deg,#5865f2 0%,#4752c4 50%,#3b3fa8 100%)" }}
      />

      <div className="px-3 relative">
        <div className="absolute -top-17 left-3 size-16 rounded-full ring-4 ring-[#111214] overflow-hidden bg-[#1e1f22] flex items-center justify-center">
          {avatar ? (
            <Image src={avatar} width={64} height={64} alt={username} className="size-full object-cover" />
          ) : (
            <UserCircle2 className="size-full text-[#4e5058] p-1.5" />
          )}
        </div>
        <div className="absolute -top-5 left-13 size-3.5 rounded-full bg-[#23a559] ring-2 ring-[#111214]" />

        <div className="mt-10 pb-2">
          <p className="font-bold text-[#f2f3f5] text-sm leading-tight truncate">
            {username || <span className="text-[#4e5058]">Display Name</span>}
          </p>
          <p className="text-xs text-[#949ba4] mt-0.5">
            @{(username || "username").toLowerCase().replace(/\s+/g, "_")}
          </p>
        </div>
      </div>

      <div className="mx-3 h-px bg-white/10" />

      <div className="px-3 py-3 space-y-3">
        {bio ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#f2f3f5] mb-1">About Me</p>
            <p className="text-xs text-[#b5bac1] leading-relaxed line-clamp-4">{bio}</p>
          </div>
        ) : (
          <p className="text-xs text-[#4e5058] italic">No bio yet…</p>
        )}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#f2f3f5] mb-1">Member Since</p>
          <p className="text-xs text-[#b5bac1]">
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  )
}


function Section({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#f2f3f5]">{label}</p>
        {hint && <p className="text-xs text-[#949ba4] mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  )
}


type Props = { serverId: string; userId: string }

function ProfileEditorContent({ serverId, userId }: Props) {
  const cacheKey = serverId && userId ? `/server/profile/${serverId}/${userId}` : null
  const { data, isLoading } = useSWR(cacheKey, () => getServerProfile(serverId, userId))

  const form = useForm<UpdateServerProfileType>({
    resolver: zodResolver(updateServerProfileSchema),
    defaultValues: { username: "", avatar: "", bio: "" },
    mode: "all",
  })
  const { addFiles, attachedFiles, removeFile, errors: fileErrors, isDragging, onDragOver, onDragLeave, onDrop } = useAttachedFiles()
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const watched = form.watch()
  const isChanged = form.formState.isDirty
  const isSubmitting = form.formState.isSubmitting
  const bioLen = watched.bio?.length ?? 0
  const nameLen = watched.username?.length ?? 0
  const previewAvatar = attachedFiles[0]?.preview ?? watched.avatar ?? ""

  useEffect(() => {
    if (data) form.reset({ username: data.username, avatar: data.avatar, bio: data.bio ?? "" })
  }, [data])

  const submit = async (values: UpdateServerProfileType) => {
    setSubmitStatus(null)
    try {
      const patch: Parameters<typeof updateServerProfile>[0]["payload"] = {}
      if (form.formState.dirtyFields.username) patch.username = values.username
      if (form.formState.dirtyFields.bio) patch.bio = values.bio
      if (attachedFiles.length > 0) {
        const uploaded = await uploadImage(attachedFiles[0].file)
        patch.avatar = uploaded.url
        patch.avatar_asset_id = uploaded.public_id
      }
      const result = await updateServerProfile({ serverId, userId, payload: patch })
      if (result?.error) { setSubmitStatus({ type: "error", message: result.error }); return }
      form.reset({ ...values, avatar: patch.avatar ?? values.avatar })
      setSubmitStatus({ type: "success", message: "Changes saved!" })
      setTimeout(() => setSubmitStatus(null), 3000)
    } catch {
      setSubmitStatus({ type: "error", message: "Something went wrong. Try again." })
    }
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      <DialogClose className="absolute top-4 right-4 z-10 flex items-center justify-center size-8 rounded-lg bg-[#3f4147] hover:bg-[#35373c] text-[#949ba4] hover:text-[#f2f3f5] transition-colors">
        <X size={15} />
        <span className="sr-only">Close</span>
      </DialogClose>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-10 py-10 pb-28">
          <phantom-ui loading={isLoading}>
            <div className="space-y-8">
              <header className="space-y-1">
                <h2 className="text-xl font-bold text-[#f2f3f5]">Edit Server Profile</h2>
                <p className="text-sm text-[#949ba4]">
                  Changes here only apply to this server and won&apos;t affect your global profile.
                </p>
              </header>

              <Section label="Server Avatar" hint="Replaces your global avatar in this server.">
                <div
                  className={`flex items-center gap-5 p-4 rounded-xl bg-[#2b2d31] border transition-colors ${isDragging ? "border-[#5865f2] bg-[#5865f2]/10" : "border-white/5"}`}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                >
                  <div className="size-20 rounded-full overflow-hidden bg-[#1e1f22] ring-2 ring-white/10 shrink-0 flex items-center justify-center">
                    {previewAvatar ? (
                      <Image src={previewAvatar} width={80} height={80} alt="avatar" className="size-full object-cover" />
                    ) : (
                      <UserCircle2 className="size-full text-[#4e5058] p-2" />
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap gap-2">
                      <label
                        htmlFor="sp-avatar"
                        className="cursor-pointer px-4 py-1.5 rounded-md text-sm font-medium bg-[#5865f2] hover:bg-[#4752c4] text-white transition-colors"
                      >
                        Change Avatar
                      </label>
                      {attachedFiles.length > 0 && (
                        <button
                          type="button"
                          onClick={() => { removeFile(0); form.resetField("avatar") }}
                          className="px-4 py-1.5 rounded-md text-sm font-medium text-[#949ba4] hover:text-[#f2f3f5] hover:bg-[#3f4147] transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[#6d6f78]">Recommended: 128×128 px or larger</p>
                    {fileErrors.map((e, i) => <p key={i} className="text-xs text-[#f23f42]">{e}</p>)}
                  </div>
                  <Controller
                    control={form.control}
                    name="avatar"
                    render={() => (
                      <input
                        id="sp-avatar"
                        type="file"
                        accept={ALLOWED_FILE_EXTENSIONS}
                        className="hidden"
                        onChange={(e) => {
                          if (!e.target.files) return
                          const files = Array.from(e.target.files)
                          addFiles(files)
                          if (files.length > 0) form.setValue("avatar", files[0].name, { shouldDirty: true, shouldTouch: true })
                        }}
                      />
                    )}
                  />
                </div>
              </Section>

              <div className="h-px bg-white/6" />

              <Section label="Display Name" hint="How your name appears to others in this server.">
                <Controller
                  control={form.control}
                  name="username"
                  render={({ field, fieldState }) => (
                    <div className="space-y-1.5">
                      <div className="relative">
                        <Input
                          {...field}
                          maxLength={32}
                          autoComplete="off"
                          placeholder="Your server display name…"
                          className={cn(
                            "pr-14 bg-[#1e1f22] border border-white/10 text-[#f2f3f5] placeholder:text-[#4e5058] focus-visible:ring-1 focus-visible:ring-[#5865f2] focus-visible:border-[#5865f2] ring-0! transition-colors",
                            fieldState.error && "border-[#f23f42] focus-visible:ring-[#f23f42] focus-visible:border-[#f23f42]"
                          )}
                        />
                        <span className={cn(
                          "absolute right-3 top-1/2 -translate-y-1/2 text-[11px] tabular-nums pointer-events-none",
                          nameLen >= 28 ? "text-yellow-400" : "text-[#4e5058]"
                        )}>
                          {nameLen}/32
                        </span>
                      </div>
                      {fieldState.error && (
                        <p className="text-xs text-[#f23f42]">{fieldState.error.message}</p>
                      )}
                    </div>
                  )}
                />
              </Section>

              <div className="h-px bg-white/6" />

              {/* About Me */}
              <Section label="About Me" hint="Visible on your profile card in this server. Max 190 characters.">
                <Controller
                  control={form.control}
                  name="bio"
                  render={({ field, fieldState }) => (
                    <div className="space-y-1.5">
                      <div className="relative">
                        <textarea
                          {...field}
                          maxLength={190}
                          rows={5}
                          placeholder="Tell people a bit about yourself…"
                          className={cn(
                            "w-full resize-none bg-[#1e1f22] border border-white/10 rounded-md text-[#f2f3f5] text-sm placeholder:text-[#4e5058] p-3 pb-7 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5865f2] focus-visible:border-[#5865f2] transition-colors",
                            fieldState.error && "border-[#f23f42]"
                          )}
                        />
                        <span className={cn(
                          "absolute bottom-2.5 right-3 text-[11px] tabular-nums pointer-events-none",
                          bioLen >= 170 ? "text-yellow-400" : "text-[#4e5058]"
                        )}>
                          {bioLen}/190
                        </span>
                      </div>
                      {fieldState.error && (
                        <p className="text-xs text-[#f23f42]">{fieldState.error.message}</p>
                      )}
                    </div>
                  )}
                />
              </Section>
            </div>
          </phantom-ui>
        </div>

        {/* ── Right: preview ── */}
        <div className="w-70 shrink-0 overflow-y-auto h-full border-l border-white/6 bg-[#2b2d31]/30 px-6 py-10 hidden xl:flex flex-col gap-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#6d6f78]">Preview</p>
          <ProfileCard
            username={watched.username ?? ""}
            avatar={previewAvatar}
            bio={watched.bio ?? ""}
          />
          <p className="text-[10px] text-[#4e5058] leading-relaxed">
            This is how your profile card appears to other members in this server.
          </p>
        </div>
      </div>

      {/* ── Save bar ── */}
      <div className={cn(
        "absolute bottom-0 inset-x-0 z-20 flex items-center justify-between px-8 py-3 border-t border-white/10 bg-[#111214]/95 backdrop-blur-sm transition-all duration-200",
        (isChanged || submitStatus) ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      )}>
        {submitStatus?.type === "error" ? (
          <>
            <p className="text-sm text-[#f23f42]">{submitStatus.message}</p>
            <div className="flex gap-3">
              <button type="button" className="text-sm text-[#949ba4] hover:text-[#f2f3f5] transition-colors" onClick={() => { form.reset(); setSubmitStatus(null) }}>Reset</button>
              <button type="button" onClick={form.handleSubmit(submit)} className="px-4 py-1.5 rounded-md text-sm font-medium bg-[#5865f2] hover:bg-[#4752c4] text-white transition-colors">Retry</button>
            </div>
          </>
        ) : submitStatus?.type === "success" ? (
          <p className="text-sm text-[#23a559] flex items-center gap-2 font-medium">
            <Check size={14} /> Saved successfully!
          </p>
        ) : (
          <>
            <p className="text-sm text-[#dbdee1]">
              <span className="font-semibold text-yellow-400">Careful</span> — you have unsaved changes!
            </p>
            <div className="flex gap-3 items-center">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => form.reset()}
                className="text-sm text-[#949ba4] hover:text-[#f2f3f5] disabled:opacity-40 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={form.handleSubmit(submit)}
                className="px-4 py-1.5 rounded-md text-sm font-medium bg-[#23a559] hover:bg-[#1a8c4a] text-white disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                {isSubmitting ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Dialog Shell ─────────────────────────────────────────────────────────────

export default function EditPerServerProfileDialog({ serverId, userId }: Props) {
  return (
    <Dialog>
      <DialogTrigger className="w-full p-1.5 text-sm rounded flex justify-between items-center hover:bg-sidebar-primary/15 text-white hover:text-white transition-colors">
        <p>Edit Per-server profile</p>
        <Pen size={20} />
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        onKeyDown={(e) => e.stopPropagation()}
        className="min-w-full min-h-screen rounded-none bg-[#313338] p-0 border-none ring-0"
      >
        <div className="relative h-screen flex flex-col">
          <ProfileEditorContent serverId={serverId} userId={userId} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
