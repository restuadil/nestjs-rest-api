import z from "zod";

import { QuerySchema } from "src/common/helpers/base-query.dto";
import { getSchemaKeys } from "src/common/helpers/get-schema-keys";

import { CategorySchema } from "../entities/category.entity";

export const queryCategorySchema = QuerySchema.extend({
  sort: z.enum(getSchemaKeys(CategorySchema)).default("createdAt"),
});

export type QueryCategoryDto = z.infer<typeof queryCategorySchema>;
