import z from "zod";

export const createProductVariantSchema = z.object({
  color: z.string().trim(),
  price: z.number(),
  quantity: z.number(),
  image: z.url().optional(),
  size: z.string().trim(),
});

export type CreateProductVariantDto = z.infer<typeof createProductVariantSchema>;
