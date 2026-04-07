import express from 'express';
import cors from 'cors';
import 'dotenv/config';


import { config } from './config/env.js';

import { answer, debugStream, streamAnswer } from './rag/raglib.js';

const app = express();
const PORT = 3000;




app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});



app.post("/api/chat", async (req, res) => {
  const { message } = req.body as { message?: string };

  if (!message?.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  try {
    await streamAnswer(message.trim(), res);
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


/*
app.post('/api/chat', async (req, res) => {
  const { message } = req.body as { message?: string };

  try {
    if (!message?.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    await debugStream(message.trim());

    return res.json({ ok: true });
  } catch (error) {
    console.error('Error in /api/chat:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
*/

/*

app.post('/api/chat', async (req, res) => {
  const { message } = req.body as { message?: string };

  try {
    if (!message?.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const llmAnswer= await answer(message.trim());

    return res.json({
      answer: llmAnswer.answer,
      //sources: llmAnswer.sources.map((s) => s.title),
      sources: llmAnswer.sources,
    });
  } catch (error) {
    console.error('Error in /api/chat:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

*/

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


console.log(config);


/*
const fakeAnswer="Fishing is one of humanity's oldest activities—evidence shows people have "+
                   "been doing it for at least 23,000 years, with some of the earliest hooks "+
                   "crafted from sea snail shells.Fishing is one of humanity's oldest activities—evidence "+
                   "shows people have been doing it for at least 23,000 years, with some of the earliest hooks "+
                   "crafted from sea snail shells";
*/