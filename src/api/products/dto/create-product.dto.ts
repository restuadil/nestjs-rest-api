import { Types } from "mongoose";
import z from "zod";

export const createProductSchema = z.object({
  name: z.string().min(3).trim(),
  description: z.string().min(3).trim(),
  variants: z.array(
    z.object({
      color: z.string().min(3).trim(),
      price: z.number(),
      quantity: z.number(),
      image: z.url().optional(),
      size: z.string().min(3).trim(),
    }),
  ),
  category: z.array(
    z.string().refine((val) => Types.ObjectId.isValid(val), {
      message: "Invalid ObjectId",
    }),
  ),
  brand: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  }),
  image: z.url().optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
