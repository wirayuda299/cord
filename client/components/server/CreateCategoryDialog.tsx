"use client"

import { FolderPlus } from "lucide-react"
import { DialogContent, Dialog, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Controller, useForm } from "react-hook-form"
import { createCategory } from "@/lib/server/actions/categories"
import type { CreateCategoryPayload } from "@/lib/types/category"

export default function CreateCategoryDialog({ serverId, userId }: { serverId: string; userId: string }) {
  const { handleSubmit, reset, control, formState: { isSubmitting } } = useForm<CreateCategoryPayload>({
    defaultValues: { name: "", server_id: serverId, created_by: userId },
  })

  const onSubmit = async (data: CreateCategoryPayload) => {
    try {
      const res = await createCategory(data)
      if (res.error) {
        alert(res.error)
        return
      }
    } catch (e) {
      alert(e)
    } finally {
      reset()
    }
  }

  return (
    <Dialog>
      <DialogTrigger className="w-full p-1.5 text-sm rounded flex justify-between items-center hover:bg-sidebar-primary/15">
        <p>Create category</p>
        <FolderPlus size={20} />
      </DialogTrigger>

      <DialogContent
        onKeyDown={(e) => e.stopPropagation()}
        className="p-0 overflow-hidden rounded-sm w-115 bg-surface-base border-none shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_8px_16px_rgba(0,0,0,0.6)]"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 pt-6 pb-0">
            <h2 className="text-xl font-bold text-text-bright tracking-tight mb-1">
              Create Category
            </h2>
            <p className="text-[13px] text-text-dim mb-5">
              Categories help organize your channels into groups.
            </p>
          </div>

          <div className="px-6 pb-0">
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <div className="mb-5">
                  <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-[0.06em] mb-2">
                    Category Name
                  </label>
                  <input
                    {...field}
                    type="text"
                    placeholder="New Category"
                    maxLength={20}
                    required
                    className="w-full bg-bg-input rounded text-[15px] text-text-primary placeholder-text-placeholder px-3 py-2.5 outline-none focus:ring-2 focus:ring-discord-brand border-none"
                  />
                </div>
              )}
            />
            <div className="h-px bg-surface-hover mb-4" />
          </div>

          <div className="bg-surface-raised px-6 py-4 flex items-center justify-end gap-3">
            <DialogClose
              type="button"
              className="text-[13.5px] font-medium text-text-primary hover:text-white hover:underline px-4 py-2 rounded bg-transparent border-none cursor-pointer transition-colors"
            >
              Cancel
            </DialogClose>
            <button
              type="submit"
              disabled={isSubmitting}
              className="text-[13.5px] font-medium text-white bg-discord-brand hover:bg-accent-blue disabled:opacity-50 px-4 py-2 rounded border-none cursor-pointer transition-colors"
            >
              Create Category
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
