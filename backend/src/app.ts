import express from 'express';
import cors from 'cors';
import 'dotenv/config';


import { config } from './config/env.js';

import { streamAnswer } from './rag/raglib.js';

import { type ChatTurn } from '../../shared/raq/types.js';

const app = express();
const PORT = 3000;




app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});



app.post("/api/chat", async (req, res) => {
  const { message, history = [] } = req.body as {
    message?: string;
    history?: ChatTurn[];
  };

  if (!message?.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  try {
    await streamAnswer(message.trim(), history, res);
  } catch (error) {
    console.error("Error in /api/chat:", error);

    res.write(
      JSON.stringify({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      }) + "\n"
    );

    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


console.log(config);
