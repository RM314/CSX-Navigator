/*
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

import { config } from './src/config/env';
*/

import { buildIndex, answer, listModels } from "./rag/raglib.js";

import 'dotenv/config';

/**
 * Minimal local RAG pipeline for LM Studio's OpenAI-compatible API.
 *
 * Requirements:
 * 1. Start LM Studio server (default: http://localhost:1234)
 * 2. Load a chat model in LM Studio
 * 3. Load an embedding model in LM Studio
 *
 * Example:
 *   export LLM_BASE_URL=http://localhost:1234/v1
 *   export LLM_API_KEY=lm-studio
 *   export CHAT_MODEL=qwen2.5-7b-instruct
 *   export EMBEDDING_MODEL=text-embedding-nomic-embed-text-v1.5
 *
 * Usage:
 *   npx tsx rag-pipeline-lmstudio.ts index
 *   npx tsx rag-pipeline-lmstudio.ts ask "What is Community-Supported X?"
 */

/*
const BASE_URL = process.env.LLM_BASE_URL ?? "http://localhost:1234/v1";
const API_KEY = process.env.LLM_API_KEY ?? "lm-studio";
const CHAT_MODEL = process.env.CHAT_MODEL ?? "local-model";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "text-embedding-model";
*/



async function main() {
  const [command, ...rest] = process.argv.slice(2);

  switch (command) {
    case "index":
      await buildIndex();
      break;

    case "ask": {
      const question = rest.join(" ").trim();
      if (!question) {
        throw new Error('Usage: npx tsx rag-pipeline-lmstudio.ts ask "Your question here"');
      }
      await answer(question);
      break;
    }

    case "models":
      await listModels();
      break;

    default:
      console.log("Usage:");
      console.log("  npx tsx rag-pipeline-lmstudio.ts models");
      console.log("  npx tsx rag-pipeline-lmstudio.ts index");
      console.log('  npx tsx rag-pipeline-lmstudio.ts ask "What is CSX?"');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
