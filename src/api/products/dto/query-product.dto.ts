import { Types } from "mongoose";
import z from "zod";

import { QuerySchema } from "src/common/helpers/base-query.dto";
import { getSchemaKeys } from "src/common/helpers/get-schema-keys";

import { Product, ProductSchema } from "../entities/product.entity";

export const queryProductSchema = QuerySchema.extend({
  sort: z.enum(getSchemaKeys(ProductSchema)).default("createdAt"),
  categoryId: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), { message: "Invalid ObjectId" })
    .transform((val) => new Types.ObjectId(val))
    .optional(),
  brandId: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), { message: "Invalid ObjectId" })
    .transform((val) => new Types.ObjectId(val))
    .optional(),
});

export type QueryProductDto = z.infer<typeof queryProductSchema>;

export interface QueryResponseProduct extends Product {
  totalQuantity: number;
  minPrice: number;
  maxPrice: number;
}
