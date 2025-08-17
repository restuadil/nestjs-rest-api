import z from "zod";

export const createBrandSchema = z.object({
  name: z.string().min(3).trim(),
  image: z.string().url().optional(),
});

export type CreateBrandDto = z.infer<typeof createBrandSchema>;
