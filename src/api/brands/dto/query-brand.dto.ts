import z from "zod";

import { QuerySchema } from "src/common/helpers/base-query.dto";
import { getSchemaKeys } from "src/common/helpers/get-schema-keys";

import { BrandSchema } from "../entities/brand.entity";

export const queryBrandSchema = QuerySchema.extend({
  sort: z.enum(getSchemaKeys(BrandSchema)).default("createdAt"),
});

export type QueryBrandDto = z.infer<typeof queryBrandSchema>;
