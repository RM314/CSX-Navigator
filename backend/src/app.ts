import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { config } from './config/env.js';
import { apiRouter } from "./routes/api/controllers.js"

import {connectDb } from "./rag/db.js"

const app = express();
const PORT = 3000;




app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", apiRouter);

await connectDb();

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


console.log(config);
