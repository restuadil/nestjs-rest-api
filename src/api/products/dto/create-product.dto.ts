import { Types } from "mongoose";
import z from "zod";

import { createProductVariantSchema } from "src/api/product-variant/dto/create-product-variant.dto";

export const createProductSchema = z.object({
  name: z.string().min(3).trim(),
  description: z.string().min(3).trim(),
  variants: z.array(createProductVariantSchema),
  categoryIds: z.array(
    z
      .string()
      .refine((val) => Types.ObjectId.isValid(val), {
        message: "Invalid ObjectId",
      })
      .transform((val) => new Types.ObjectId(val)),
  ),
  brandId: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), {
      message: "Invalid ObjectId",
    })
    .transform((val) => new Types.ObjectId(val)),
  image: z.url(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
