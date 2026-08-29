import { z } from "zod"

export const createChannelSchema = z.object({
  name: z.string().min(3).max(20),
  type: z.string(),
  topic: z.string().max(200).optional(),
})

export type CreateChannelPayload = z.infer<typeof createChannelSchema>
export type CreateChannelServer = CreateChannelPayload & { categoryID: string | null, serverID: string }
