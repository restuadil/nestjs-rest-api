import z from "zod";

import { QuerySchema } from "src/common/helpers/base-query.dto";
import { getSchemaKeys } from "src/common/helpers/get-schema-keys";
import { Role } from "src/types/role.type";

import { UserSchema } from "../entities/user.entitiy";

export const queryUserSchema = QuerySchema.extend({
  sort: z.enum(getSchemaKeys(UserSchema)).default("createdAt"),
  roles: z.enum([Role.ADMIN, Role.USER]).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export type QueryUserDto = z.infer<typeof queryUserSchema>;
