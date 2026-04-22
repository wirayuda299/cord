"use client"

import { Edit, ImagePlus, Plus } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { createServer } from "@/lib/server/actions/servers"
import { Controller, useForm } from "react-hook-form"
import {
  createServerSchema,
  type CreateServerSchemaType,
} from "@/lib/validation/server"
import { zodResolver } from "@hookform/resolvers/zod"

export default function CreateServerForm() {
  const [preview, setPreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    if (!imageFile) return
    const url = URL.createObjectURL(imageFile)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const form = useForm<CreateServerSchemaType>({
    resolver: zodResolver(createServerSchema as any),
    defaultValues: {
      name: "",
    }
  })

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
  }

  const handleSubmit = async (data: CreateServerSchemaType) => {
    if (!data.name.trim()) return

    try {
      const res = await createServer(data.name, "usr_001")
      if (res.error) {
        alert(res.error)
        return
      }
      alert("Server created")
    } catch (e) {
      alert(e)
    }
  }

  return (
    <Dialog>
      <DialogTrigger className=" w-12 group flex items-center justify-center h-12 rounded-[50%] hover:rounded-[20%] transition-all ease duration-300  text-(--discord-green) bg-(--server-item) hover:bg-(--discord-green)">
        <Plus className="text-(--discord-green) group-hover:text-white" />
      </DialogTrigger>
      <DialogContent
        onKeyDown={(e) => e.stopPropagation()}
        showCloseButton={false}
        className="bg-sidebar-secondary border-none text-white max-w-md p-0 overflow-hidden"
      >
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="flex flex-col items-center gap-4 pt-8 px-6">
            <label className="cursor-pointer group">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImage}
              />
              <div className="w-20 h-20 rounded-full relative border-2 border-dashed border-gray-500 group-hover:border-indigo-400 transition-colors flex items-center justify-center overflow-hidden">
                {preview ? (
                  <>
                    <Image
                      src={preview}
                      alt="Server icon"
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute left-0 bg-sidebar-secondary/50 h-full justify-center group-hover:opacity-100 opacity-0 right-0 flex items-center transition-all ease-in-out">
                      <Edit className="text-sidebar-secondary" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-indigo-400 transition-colors">
                    <ImagePlus size={22} />
                    <span className="text-[10px] font-semibold uppercase">
                      Upload
                    </span>
                  </div>
                )}
              </div>
            </label>

            <DialogHeader className="text-center space-y-1">
              <DialogTitle className="text-white text-xl font-bold">
                Customize your server
              </DialogTitle>
              <p className="text-gray-400 text-sm">
                Give your server a name and an icon. You can always change it
                later.
              </p>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6 mt-2 flex flex-col gap-4">
            <Controller
              control={form.control}
              name="name"
              render={({ field }) => (
                <Field className="flex flex-col gap-1.5">
                  <FieldLabel className="text-xs font-bold uppercase text-gray-300">
                    Server Name <span className="text-red-400">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    autoComplete="off"
                    placeholder="Enter server name"
                    className="bg-bg-input border-none text-white placeholder-gray-500 focus-visible:ring-1 focus-visible:ring-indigo-500"
                  />
                </Field>
              )}
            />

            <p className="text-xs text-gray-500">
              By creating a server, you agree to Discord's
              <span className="text-indigo-400 cursor-pointer hover:underline">
                Community Guidelines
              </span>
              .
            </p>

            <div className="flex justify-between items-center pt-2">
              <DialogClose type="button" className="text-gray-300 hover:text-white">
                Back
              </DialogClose>
              <Button
                type="submit"
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
