import OpenAI from "openai";

import { config } from "../config/env.js";

export const client = new OpenAI({
  baseURL: config.LLM_BASE_URL,
  apiKey: config.LLM_API_KEY,
});

