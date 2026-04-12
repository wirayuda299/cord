import { z } from "zod";

export const createServerSchema = z.object({
  name: z.string().min(3).max(20),
});

export type CreateServerSchemaType = z.infer<typeof createServerSchema>;
