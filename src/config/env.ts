import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string(),
  DATABASE_NAME: z.string(),
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRATION_TIME: z.string(),
  JWT_REFRESH_EXPIRATION_TIME: z.string(),
  EMAIL_SMTP_SECURE: z.coerce.boolean().default(true),
  EMAIL_SMTP_PASS: z.string(),
  EMAIL_SMTP_USER: z.string(),
  EMAIL_SMTP_PORT: z.coerce.number(),
  EMAIL_SMTP_HOST: z.string(),
  EMAIL_SMTP_SERVICE_NAME: z.string(),
  CLIENT_HOST: z.string(),
  EMAIL_FROM: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),
  REDIS_PASSWORD: z.string(),
  REDIS_TTL: z.coerce.number(),
  THROTTLE_TTL: z.coerce.number(),
  THROTTLE_LIMIT: z.coerce.number(),
  SALT: z.coerce.number(),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (config: Record<string, unknown>) => {
  const parsed = envSchema.safeParse(config);

  if (parsed.success === false) {
    throw new Error(`Config validation error:\n${parsed.error.message}`);
  }

  return parsed.data;
};
