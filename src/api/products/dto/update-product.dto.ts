import { Types } from "mongoose";
import z from "zod";

export const updateProductSchema = z.object({
  name: z.string(),
  description: z.string().min(3).trim(),
  category: z.array(
    z
      .string()
      .refine((val) => Types.ObjectId.isValid(val), {
        message: "Invalid ObjectId",
      })
      .transform((val) => new Types.ObjectId(val)),
  ),
  brand: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), {
      message: "Invalid ObjectId",
    })
    .transform((val) => new Types.ObjectId(val)),
  image: z.url(),
});

export type UpdateProductDto = z.infer<typeof updateProductSchema>;
