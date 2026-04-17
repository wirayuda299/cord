import { Check, Loader2, X } from "lucide-react"

import Image from "next/image"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Field, FieldDescription, FieldLabel } from "../ui/field"
import { Input } from "../ui/input"
import { useAttachedFiles } from "@/hooks/useAttachedFiles"
import { useEffect, useRef, useState } from "react"
import { ALLOWED_FILE_EXTENSIONS } from "@/lib/shared/file-validation"
import { cn } from "@/lib/utils"
import { Switch } from "../ui/switch"
import useSWR from "swr"
import getServerById from "@/lib/client/api/server"
import { useParams } from "next/navigation"
import { updateServer } from "@/lib/server/actions/servers"
import { uploadImage } from "@/lib/server/actions/images"
import { updateServerSchema, UpdateServerType } from "@/lib/validation/server"

const gradients = [
  ["#1f1f1f", "#3a3a3a"], // dark gray
  ["#ff4d8d", "#ff9ecb"], // pink
  ["#ff3b3b", "#ff8a5c"], // red-orange
  ["#ff7a18", "#ffd166"], // orange-yellow
  ["#ffd43b", "#fff3a3"], // yellow
  ["#6a4c93", "#b497d6"], // purple
  ["#1e90ff", "#70d6ff"], // blue
  ["#2ec4b6", "#90f1ef"], // teal
  ["#3a5a00", "#a4c639"], // green
  ["#2b2b2b", "#6e6e6e"], // neutral gray
]

type Props = {
  selected: string[]
  name: string
}

function ServerProfilePreview({ selected, name }: Props) {
  return (
    <div
      style={{
        background: `radial-gradient(circle at bottom,
                    ${selected[0]} 0%,
                    ${selected[0]}cc 30%,
                    ${selected[1]} 70%,
                    ${selected[1]} 100% )`
      }}
      className={`size-64 min-w-64 rounded-lg sticky top-0`}>
      <div className="absolute h-max w-full p-3 bottom-0 bg-(--discord-chat)">
        <div className="size-14  border border-sidebar-secondary rounded-md absolute bottom-20 left-7">
          <Image src="/globe.svg" className="size-full" width={20} height={20} alt="logo" />
        </div>
        <div className="mt-10">
          <p>{name}</p>
          <div className="flex items-center gap-3 mt-1">
            <p className='flex items-center text-xs gap-2'>
              <span className="block size-2 rounded-full bg-green-500"></span>
              0 online
            </p>
            <p className='flex items-center text-xs gap-2'>
              <span className="block size-2 rounded-full bg-gray-500"></span>
              1 member
            </p>
          </div>
          <p className="text-xs pt-1">Since 19 Desember 2025</p>
        </div>
      </div>
    </div>
  )
}


export default function ServerProfile() {
  const params = useParams()
  const id = params.id as string

  const { isLoading, data, error } = useSWR(() => id ? "/api/server" : null, () => getServerById(id))

  const fileRef = useRef<HTMLInputElement>(null)
  const form = useForm<UpdateServerType>({
    resolver: zodResolver(updateServerSchema),
    defaultValues: {
      name: "",
      icon: "",
      banner: [],
      description: "",
      private: false
    },
    mode: 'all'
  })
  const { addFiles, attachedFiles, removeFile, errors } = useAttachedFiles()
  const selected = form.watch("banner")
  const isChange = form.formState.isDirty
  const isSubmitting = form.formState.isSubmitting
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (data) {
      form.reset({
        name: data?.data.name ?? "",
        icon: data?.data.logo ?? "",
        banner: data?.data.banner_colors,
        private: data?.data.private ?? false,
        description: data?.data.description ?? "",
      })
    }
  }, [data])

  const update = async (data: UpdateServerType) => {
    setSubmitStatus(null)
    try {
      let iconUrl = data.icon
      let iconAssetId = ""

      if (attachedFiles.length > 0) {
        const uploaded = await uploadImage(attachedFiles[0].file)
        iconUrl = uploaded.url
        iconAssetId = uploaded.public_id
        console.log({ uploaded })
      }

      const result = await updateServer({
        serverId: id,
        fields: form.formState.dirtyFields as Partial<Record<keyof UpdateServerType, boolean>>,
        payload: {
          name: data.name,
          banner_colors: data.banner,
          description: data.description,
          private: data.private,
          icon: iconUrl,
          icon_asset_id: iconAssetId,
        },
      })

      if (result?.error) {
        setSubmitStatus({ type: 'error', message: result.error })
        return
      }

      form.reset({ ...data, icon: iconUrl })
      setSubmitStatus({ type: 'success', message: 'Changes saved!' })
      setTimeout(() => setSubmitStatus(null), 3000)
    } catch {
      setSubmitStatus({ type: 'error', message: 'Something went wrong. Try again.' })
    }
  }
  return (
    <div className="px-5 pt-5 overflow-y-auto max-h-screen text-white w-full flex justify-between gap-5">
      <div className="max-w-3xl h-max mx-auto">
        <header className="space-y-3">
          <h2 className="font-semibold text-xl w-max">Server Profile</h2>
          <p className={isLoading ? "w-12.5" : ""}> Customize how your server appears in invite links and, if enabled, in Server Discovery and Announcement Channel messages</p>
        </header>

        <form onSubmit={form.handleSubmit(update)}>
          <phantom-ui loading={isLoading}>
            <div className="mt-10 flex flex-col gap-5">
              <Controller
                control={form.control}
                name="name"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Server name</FieldLabel>
                    <Input
                      max={50}
                      maxLength={50}
                      required
                      autoComplete="off"
                      className="rounded border border-sidebar-secondary focus-visible:outline-none ring-0!"
                      {...field}
                      placeholder="server name..." />
                  </Field>
                )}
              />


              {attachedFiles.length > 0 && (
                <div className="relative size-36">
                  <Image
                    className="size-36 object-cover rounded-md"
                    src={attachedFiles[0].preview}
                    width={100}
                    height={100}
                    alt='icon'
                  />
                  <button
                    type="button"
                    className="absolute cursor-pointer top-0 right-0 rounded-full bg-white"
                    onClick={() => { removeFile(0); form.resetField("icon") }}>
                    <X className="text-red-600" />
                  </button>
                </div>
              )}
              <Controller
                control={form.control}
                name="icon"
                render={() => (
                  <Field>
                    <FieldLabel>
                      Icon
                    </FieldLabel>
                    <FieldDescription>We recommend at least 512x512</FieldDescription>
                    <label
                      className="bg-discord-blue cursor-pointer block px-3 py-2 rounded-md text-sm max-w-max text-center"
                      htmlFor="attachment">Change server icon</label>
                    <input
                      ref={fileRef}
                      id="attachment"
                      type="file"
                      multiple={false}
                      name="attachment"
                      accept={ALLOWED_FILE_EXTENSIONS}
                      className="hidden"
                      onChange={(e) => {
                        if (!e.target.files) return
                        const files = Array.from(e.target.files)
                        addFiles(files)
                        if (files.length > 0) {
                          form.setValue("icon", files[0].name, { shouldDirty: true, shouldTouch: true })
                        }
                      }}
                    />
                    {errors.length > 0 && (
                      <div className="mb-2 flex flex-col gap-1">
                        {errors.map((err, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-xs px-3 py-2 rounded-lg"
                          >
                            <X size={12} />
                            {err}
                          </div>
                        ))}
                      </div>
                    )}
                  </Field>
                )}
              />

              <div className="flex flex-wrap gap-3">
                {gradients.map(g => (
                  <button
                    type="button"
                    key={g[0]}
                    onClick={() => form.setValue("banner", g, { shouldDirty: true, shouldTouch: true })}
                    className={cn("size-32 rounded-md cursor-pointer", selected.includes(g[0]) && "border border-discord-blue")} style={{
                      background: `radial-gradient(circle at bottom,
                        ${g[0]} 0%,
                        ${g[0]}cc 30%,
                        ${g[1]} 70%,
                        ${g[1]} 100% )`
                    }}></button>
                ))}
              </div>

              <Controller
                control={form.control}
                name="description"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <FieldDescription>How did your server get started? Why people should join your server</FieldDescription>
                    <textarea {...field} className="h-24 resize-none border border-sidebar-secondary rounded-md focus-visible:outline-none p-2 " placeholder="Tell people about your server..." />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="private"
                render={({ field }) => (
                  <Field className="">
                    <div className="flex gap-3 justify-between">
                      <div className="max-w-87.5 w-full">
                        <div className="flex items-center gap-5">
                          <FieldLabel>Private profile</FieldLabel>
                          <Switch
                            className="data-unchecked:bg-sidebar-primary data-checked:bg-discord-blue shadow"
                            checked={field.value}
                            onCheckedChange={(checked) => form.setValue("private", checked, { shouldDirty: true, shouldTouch: true })}
                          />
                        </div>
                        <FieldDescription className="text-sm">When enabled, only server members can view profile content. Non-members won't be able to see this content unless they have an invite.</FieldDescription>
                      </div>
                      <ServerProfilePreview selected={selected} name={data?.data.name} />
                    </div>
                  </Field>
                )}
              />
              <div className={cn(
                "flex w-200 items-center justify-between rounded-md gap-5 fixed transition-all ease duration-300 p-3 bg-sidebar-secondary",
                (isChange || submitStatus) ? "bottom-4 opacity-100" : "-bottom-full opacity-0"
              )}>
                {submitStatus?.type === 'error' ? (
                  <>
                    <p className="text-red-400 text-sm">{submitStatus.message}</p>
                    <div className="flex gap-3 items-center">
                      <button type="button" className="text-sm text-gray-400" onClick={() => { form.reset(); setSubmitStatus(null) }}>Reset</button>
                      <button type="submit" className="bg-green-600 px-3 rounded py-1 text-sm">Retry</button>
                    </div>
                  </>
                ) : submitStatus?.type === 'success' ? (
                  <p className="text-green-400 text-sm flex items-center gap-2">
                    <Check size={14} /> Changes saved!
                  </p>
                ) : (
                  <>
                    <p className="text-sm">Careful! you have unsaved changes!</p>
                    <div className="flex gap-3 items-center">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        className="text-sm text-gray-400 disabled:opacity-50"
                        onClick={() => form.reset()}
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-green-600 px-3 rounded py-1 text-sm disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSubmitting && <Loader2 size={12} className="animate-spin" />}
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>

          </phantom-ui>
        </form>

      </div>
      <ServerProfilePreview selected={selected} name={data?.data.name} />
    </div >

  )
}
