import z from "zod";

import { Role } from "src/types/role.type";

export const registerSchema = z
  .object({
    username: z.string().min(3).trim(),
    email: z.string().email(),
    password: z.string(),
    roles: z.array(z.enum(Role)).default([Role.USER]),
  })
  .strict();

export type RegisterDto = z.infer<typeof registerSchema>;
