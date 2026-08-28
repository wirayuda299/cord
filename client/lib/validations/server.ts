import { z } from "zod"

export const createServerSchema = z.object({
  name: z.string().min(3).max(20),
})

export type CreateServerSchemaType = z.infer<typeof createServerSchema>
export const updateServerSchema = z.object({
  name: z.string().max(20).optional(),
  icon: z.string().optional(),
  banner: z.array(z.string()).optional(),
  description: z.string().optional(),
  private: z.boolean().optional()
})

export type UpdateServerType = z.infer<typeof updateServerSchema>
