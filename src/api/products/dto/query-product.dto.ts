import { Types } from "mongoose";
import z from "zod";

import { QuerySchema } from "src/common/helpers/base-query.dto";
import { getSchemaKeys } from "src/common/helpers/get-schema-keys";

import { ProductSchema } from "../entities/product.entity";

export const queryProductSchema = QuerySchema.extend({
  sort: z.enum(getSchemaKeys(ProductSchema)).default("createdAt"),
  categoryId: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), { message: "Invalid ObjectId" })
    .optional(),
  brandId: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), { message: "Invalid ObjectId" })
    .optional(),
});

export type QueryProductDto = z.infer<typeof queryProductSchema>;
