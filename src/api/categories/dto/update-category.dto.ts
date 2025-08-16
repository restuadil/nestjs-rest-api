import z from "zod";

import { createCategorySchema } from "./create-category.dto";

export const updateCategorySchema = createCategorySchema;

export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
