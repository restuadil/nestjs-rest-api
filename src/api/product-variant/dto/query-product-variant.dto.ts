import z from "zod";

import { QuerySchema } from "src/common/helpers/base-query.dto";
import { getSchemaKeys } from "src/common/helpers/get-schema-keys";

import { ProductVariantSchema } from "../entities/product-variant.entity";

export const queryProductVariantSchema = QuerySchema.extend({
  sort: z.enum(getSchemaKeys(ProductVariantSchema)).default("createdAt"),
});

export type QueryProductVariantDto = z.infer<typeof queryProductVariantSchema>;
