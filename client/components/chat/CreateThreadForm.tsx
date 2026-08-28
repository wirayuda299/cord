import { MessageCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createThread } from "@/lib/server/actions/messages";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

export const threadSchema = z.object({
  name: z.string().min(4).max(50),
  message_id: z.string(),
  channel_id: z.string(),
})

export type CreateThreadSchemaType = z.infer<typeof threadSchema>

export default function CreateThreadForm({
  channel_id,
  messageId,
  server_id
}: {
  channel_id: string,
  messageId: string
  server_id: string
}) {
  const router = useRouter();
  const form = useForm<CreateThreadSchemaType>({
    resolver: zodResolver(threadSchema),
    defaultValues: {
      channel_id: channel_id,
      message_id: messageId,
      name: ""
    },
  })

  const handleCreateThread = async (val: CreateThreadSchemaType) => {
    const res = await createThread({
      channel_id: val.channel_id,
      message_id: val.message_id,
      name: val.name,
      server_id
    })

    if (!res.success) {
      alert(res.message)
      return
    }
    alert("thread created")
    router.refresh()
  }

  return (
    <Dialog>
      <DialogTrigger
        className="w-full flex items-center text-white gap-2.5 px-2 py-2 text-[13px] font-medium text-left rounded cursor-pointer transition-colors duration-100  hover:bg-discord-blue "
      >
        <span className={"text-text-secondary"}>
          <MessageCircle size={15} />
        </span>
        Create thread
      </DialogTrigger>

      <DialogContent
        onKeyDown={(e) => e.stopPropagation()}
        className="max-w-110 border-none bg-(--discord-chat) text-text-primary"
      >
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg leading-3 font-semibold">
            Create Thread
          </DialogTitle>

          <p className="text-xs text-text-secondary">
            Start a new thread from this message. Give it a clear name so people know what the discussion is about.
          </p>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleCreateThread)}
          className="space-y-5 pt-2"
        >
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field className="space-y-2">
                <FieldLabel className="text-sm font-medium text-text-primary">
                  Thread name
                </FieldLabel>

                <Input
                  {...field}
                  autoComplete="off"
                  maxLength={50}
                  placeholder="Add thread name..."
                  className="h-10 ring-0 text-white border-black/10 text-sm placeholder:text-xs  placeholder:text-muted"
                />

                {fieldState.error?.message && (
                  <p className="text-xs text-danger">
                    {fieldState.error.message}
                  </p>
                )}
              </Field>
            )}
          />
          <div className="flex items-center justify-end gap-4 pt-1">
            <DialogClose>
              Cancel
            </DialogClose>

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="h-9 rounded px-4 bg-discord-blue text-white hover:bg-discord-blue/90 disabled:opacity-60"
            >
              {form.formState.isSubmitting ? "Creating..." : "Create Thread"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>)
}
