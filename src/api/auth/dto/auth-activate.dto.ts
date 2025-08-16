import z from "zod";

export const activateSchema = z.object({
  activationCode: z.string(),
});

export type ActivateDto = z.infer<typeof activateSchema>;
