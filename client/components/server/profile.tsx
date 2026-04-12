import { X } from "lucide-react"

import Image from "next/image"
import { z } from "zod"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Field, FieldDescription, FieldLabel } from "../ui/field"
import { Input } from "../ui/input"
import { useAttachedFiles } from "@/hooks/useAttachedFiles"
import { useEffect, useRef } from "react"
import { ALLOWED_FILE_EXTENSIONS } from "@/lib/shared/file-validation"
import { cn } from "@/lib/utils"
import { Switch } from "../ui/switch"
import useSWR from "swr"
import getServerById from "@/lib/client/api/server"
import { useParams } from "next/navigation"

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
  ["#0f2027", "#2c5364"], // deep blue
  ["#ff6a00", "#ee0979"], // warm blend
]

const updateServerSchema = z.object({
  name: z.string().max(20),
  icon: z.string(),
  banner: z.array(z.string()),
  description: z.string(),
  private: z.boolean().default(false)
})

type UpdateServerType = z.infer<typeof updateServerSchema>


function ServerProfilePreview({ selected }: { selected: string[] }) {
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
          <p>Server name</p>
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

  const fileRef = useRef<HTMLInputElement>(null)
  const form = useForm<UpdateServerType>({
    resolver: zodResolver(updateServerSchema as any),
    defaultValues: {
      name: "",
      icon: "",
      banner: gradients[0],
      private: false,
      description: ""
    },
    mode: 'onChange'
  })
  const { addFiles, attachedFiles, removeFile, errors } = useAttachedFiles()
  const selected = form.watch("banner")
  const isChange = form.formState.isDirty

  const { isLoading, data } = useSWR(() => id ? "/api/server" : null, () => getServerById(id))

  useEffect(() => {
    form.setValue("name", data?.data.name)
    form.setValue("icon", data?.data.logo)
    form.setValue("description", data?.data.description ?? "")
    // form.setValue("banner", data?.data.banner_colors)
    // form.setValue("icon", data?.data.logo ?? "")
    // form.setValue("private", data?.data.private ?? false)

    return () => form.reset()
  }, [isLoading])
  console.log(data)
  return (
    <phantom-ui loading={isLoading}>
      <div className="px-5 pt-5 pb-20 overflow-y-auto max-h-screen text-white w-full flex justify-between gap-5">
        <div className="max-w-3xl h-max mx-auto">
          <header className="space-y-3">
            <h2 className="font-semibold text-xl w-max">Server Profile</h2>
            <p className={isLoading ? "w-[50px]" : ""}> Customize how your server appears in invite links and, if enabled, in Server Discovery and Announcement Channel messages</p>
          </header>

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
                  className="absolute cursor-pointer top-0 right-0 rounded-full bg-white"
                  onClick={() => removeFile(0)}>
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
                    onChange={(e) =>
                      e.target.files && addFiles(Array.from(e.target.files))
                    }
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
                  key={g[0]}
                  onClick={() => form.setValue("banner", g)}
                  className={cn("size-24 rounded-md cursor-pointer", selected.includes(g[0]) && "border border-discord-blue")} style={{
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
                    <div className="max-w-[350px] w-full">
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
                    <ServerProfilePreview selected={selected} />
                  </div>
                </Field>
              )}
            />
            <div className={cn("flex items-center justify-between rounded-md  gap-5 sticky transition-all ease duration-300 -bottom-full opacity-0 w-full p-3 bg-sidebar-secondary", isChange ? "bottom-0 opacity-100" : "opacity-0 -bottom-full")}>
              <p>Carefull! you have unsaved changes!</p>
              <div className="flex gap-3 items-center">
                <button className="text-sm text-gray-500">Reset</button>
                <button className="bg-green-600 px-3 rounded py-1 text-sm">Submit</button>
              </div>
            </div>
          </div>


        </div>
        <ServerProfilePreview selected={selected} />
      </div>

    </phantom-ui>
  )
}
