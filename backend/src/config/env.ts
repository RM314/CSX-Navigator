import { z } from 'zod';
import path from "node:path";

const envSchema = z.object({
  LLM_BASE_URL: z.string().url(),
  LLM_API_KEY: z.string(),
  CHAT_MODEL: z.string(),
  EMBEDDING_MODEL: z.string(),
  MONGODB_URI: z.string(),
  DB_NAME: z.string(),
  // 900
  RAG_CHUNK_SIZE: z.coerce.number().int().positive(),
  // 150
  RAG_CHUNK_OVERLAP: z.coerce.number().int().positive(),
  KNOWLEDGE_DIR: z.string(),
  DOCUMENTS_COLLECTION: z.string(),
  CHUNKS_COLLECTION: z.string(),
  VECTOR_INDEX_NAME: z.string(),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive(),
  TOP_K: z.coerce.number().int().positive(),
  HUGGING_FACE_ACCESS_TOKEN: z.string()
});

let config = envSchema.parse(process.env);
config.KNOWLEDGE_DIR = path.resolve(config.KNOWLEDGE_DIR);

export {config} ;

