import { z } from "zod"

export const updateServerProfileSchema = z.object({
  username: z.string().min(1, "Display name is required").max(32).optional(),
  avatar: z.string().optional(),
  bio: z.string().max(190).optional(),
})

export type UpdateServerProfileType = z.infer<typeof updateServerProfileSchema>
