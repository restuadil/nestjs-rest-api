import z from "zod";

export const changePasswordSchema = z
  .object({
    password: z.string(),
    newPassword: z.string().min(8),
  })
  .strict();

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
