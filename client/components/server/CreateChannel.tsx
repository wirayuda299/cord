"use client"

import { Plus } from "lucide-react"
import { DialogContent, Dialog, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { createChannel } from "@/lib/server/actions/channels"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import type { CreateChannelPayload } from "@/lib/validation/channel"
import { channelTypes } from "@/constants/channel-type"
import { useAppStore } from "@/stores/store"

export default function CreateChannel({ serverID }: { serverID: string }) {
  const selectedCategory = useAppStore(c => c.selectedCategory)
  const { control, handleSubmit, setValue, watch, reset } = useForm<CreateChannelPayload>({
    defaultValues: {
      name: "",
      type: "",
    },
    mode: "onSubmit"
  })
  const selectedType = watch("type")

  const handleCreateChannel: SubmitHandler<CreateChannelPayload> = async (data) => {

    try {
      const res = await createChannel({
        name: data.name,
        categoryID: selectedCategory?.id ?? null,
        type: data.type,
        serverID: serverID
      })

      if (res && res.error) {
        alert(res.error)
        return
      }
      alert("Success")
    } catch (e) {
      console.log(e)
    } finally {
      reset()
    }
  }

  return (
    <Dialog modal={false}>
      <DialogTrigger className="w-full p-1.5 text-sm rounded flex justify-between items-center hover:bg-sidebar-primary/15">
        <p>Create channel</p>
        <Plus size={20} />
      </DialogTrigger>

      <DialogContent
        onKeyDown={(e) => e.stopPropagation()}
        className="p-0 overflow-hidden rounded-sm bg-surface-base border-none shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_8px_16px_rgba(0,0,0,0.6)]"
      >
        <form onSubmit={handleSubmit(handleCreateChannel)}>
          <div className="px-6 pt-6 pb-0">
            <h2 className="text-xl font-bold text-text-bright tracking-tight mb-1">
              Create Channel
            </h2>
          </div>

          <div className="px-6 pb-0">
            <p className="text-[11px] font-bold text-text-secondary uppercase tracking-[0.06em] mb-2">
              Channel Type
            </p>
            <Controller
              control={control}
              name="type"
              render={() => (
                <div className="flex flex-col gap-0.5 mb-5">
                  {channelTypes.map((type) => (
                    <div
                      onClick={() => setValue("type", type.id as typeof selectedType)}
                      key={type.id}
                      className={`flex items-center gap-3 px-3 py-3 rounded cursor-pointer border-[1.5px] transition-colors ${selectedType === type.id
                        ? "bg-discord-brand/15 border-discord-brand"
                        : "border-transparent hover:bg-white/4"
                        }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${selectedType === type.id
                          ? "bg-discord-brand text-white"
                          : "bg-bg-input text-text-secondary"
                          }`}
                      >
                        <type.icon size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] capitalize font-semibold text-text-bright leading-tight">
                          {type.name}
                        </p>
                        <p className="text-[12px] text-text-dim leading-snug mt-0.5">
                          {type.description}
                        </p>
                      </div>

                      <div
                        className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedType === type.id
                          ? "border-discord-brand"
                          : "border-text-placeholder"
                          }`}
                      >
                        {selectedType === type.id && (
                          <div className="w-2 h-2 rounded-full bg-discord-brand" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            />

            <div className="mb-5">
              <Field>
                <FieldLabel
                  htmlFor="name"
                  className="block text-[11px] font-bold text-text-secondary uppercase tracking-[0.06em] mb-2"
                >
                  Channel Name
                </FieldLabel>
              </Field>
              <Controller
                control={control}
                name="name"
                rules={{ required: true, max: 20, maxLength: 20, min: 3 }}
                render={({ field, fieldState }) => (
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-lg leading-none pointer-events-none select-none">
                      #
                    </span>
                    <input
                      autoComplete="off"
                      maxLength={20}
                      max={20}
                      required
                      {...field}
                      type="text"
                      placeholder="new-channel"
                      className="w-full bg-bg-input rounded text-[15px] text-text-primary placeholder-text-placeholder pl-7 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-discord-brand border-none"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </div>
                )}
              />
            </div>
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
              className="text-[13.5px] font-medium text-white bg-discord-brand hover:bg-accent-blue px-4 py-2 rounded border-none cursor-pointer transition-colors"
            >
              Create Channel
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
