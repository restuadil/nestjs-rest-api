import z from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(3).trim(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
