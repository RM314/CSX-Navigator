import OpenAI from "openai";

import { config } from "../config/env.js";

export const client = new OpenAI({
  baseURL: config.LLM_BASE_URL,
  apiKey: config.LLM_API_KEY,
});

export const hfClient = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: config.HUGGING_FACE_ACCESS_TOKEN,
});

