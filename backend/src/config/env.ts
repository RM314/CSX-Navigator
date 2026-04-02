import { z } from 'zod';

const envSchema = z.object({
  LLM_BASE_URL: z.string().url(),
  LLM_API_KEY: z.string(),
  CHAT_MODEL: z.string(),
  EMBEDDING_MODEL: z.string(),
});

export const config = envSchema.parse(process.env);
