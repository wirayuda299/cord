"use client"

import { DialogContent, DialogClose } from "@/components/ui/dialog"
import { updateChannel } from "@/lib/actions/channels"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { channelTypes } from "@/constants/channel-type"

type EditChannelForm = {
  name: string
}

type EditChannelDialogProps = {
  channel: {
    id: string
    name: string
    channel_type: string
  }
  serverID: string
  categoryID: string | null
}

export default function EditChannelDialog({ channel, serverID, categoryID }: EditChannelDialogProps) {
  const { control, handleSubmit } = useForm<EditChannelForm>({
    defaultValues: {
      name: channel.name,
    },
    mode: "onSubmit"
  })

  const handleUpdateChannel: SubmitHandler<EditChannelForm> = async (data) => {
    const res = await updateChannel({
      channelId: channel.id,
      name: data.name,
      categoryId: categoryID,
      serverId: serverID,
    })

    if (!res.success) {
      alert(res.message)
      return
    }
    alert("channel updated")
  }

  return (
    <DialogContent
      onKeyDown={(e) => e.stopPropagation()}
      className="p-0 overflow-hidden rounded-sm bg-surface-chat md:bg-surface-base border-none shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_8px_16px_rgba(0,0,0,0.6)] "
    >
      <form onSubmit={handleSubmit(handleUpdateChannel)}>
        <div className="px-3 md:px-6 pt-6 pb-0">
          <h2 className="text-sm md:text-xl font-bold text-text-bright tracking-tight mb-1">
            Edit Channel
          </h2>
        </div>

        <div className="px-3 md:px-6 pb-0">
          <p className="text-[10px] md:text-[11px] md:font-bold text-text-secondary uppercase tracking-[0.06em] mb-2">
            Channel Type
          </p>
          {/* Type can't be changed after creation (backend doesn't accept it on
              update) - shown locked to the channel's current type for context,
              same list as Create Channel. */}
          <div className="flex flex-col gap-0.5 mb-5">
            {channelTypes.map((type) => {
              const isSelected = type.id === channel.channel_type
              return (
                <div
                  key={type.id}
                  aria-disabled
                  className={`flex items-center gap-3 px-3 py-1 md:py-3 rounded border-[1.5px] cursor-not-allowed ${isSelected
                    ? "bg-discord-brand/15 border-discord-brand"
                    : "border-transparent opacity-40"
                    }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isSelected
                      ? "bg-discord-brand text-white"
                      : "bg-bg-input text-text-secondary"
                      }`}
                  >
                    <type.icon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-[15px] capitalize font-semibold text-text-bright leading-tight">
                      {type.name}
                    </p>
                    <p className="text-[12px] text-text-dim hidden md:block leading-snug mt-0.5">
                      {type.description}
                    </p>
                  </div>

                  <div
                    className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected
                      ? "border-discord-brand"
                      : "border-text-placeholder"
                      }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-discord-brand" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

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
                    placeholder="# channel-name"
                    className="w-full bg-bg-input rounded text-[15px] text-text-primary placeholder-text-placeholder px-3 py-1 md:py-2.5 outline-none focus:ring-2 focus:ring-discord-brand border-none placeholder:text-xs text-xs md:text-sm"
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
            className="md:text-[13.5px] text-xs font-medium text-text-primary hover:text-white hover:underline px-4 py-2 rounded bg-transparent border-none cursor-pointer transition-colors"
          >
            Cancel
          </DialogClose>
          <button
            type="submit"
            className="md:text-[13.5px] text-xs font-medium text-white bg-discord-brand hover:bg-accent-blue px-4 py-1.5 md:py-2 rounded border-none cursor-pointer transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </DialogContent>
  )
}
