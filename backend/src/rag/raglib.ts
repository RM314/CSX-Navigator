import fs from "node:fs/promises";

import path from "node:path";
import crypto from "node:crypto";

import OpenAI from "openai";
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

import type { ResponseStreamEvent } from "openai/resources/responses/responses";

import { connectDb } from "./db.js";
import {embedTexts} from "./chunks.js";
import { client} from "./llm.js";

import type { Response } from "express";


import { config } from "../config/env.js";
import {
  type ChatTurn,
  type SourceDocument,
  type Chunk,
  type SearchResult,
  type answerType,
  answerSchema,
} from "../shared/types.js";
import * as prompts from "./prompts.js";

import { documentSchema, chunkSchema, RagDocument, RagChunk } from "./types.js";
import type { RagDocumentDb, RagChunkDb } from "./types.js";

async function search(query: string, topK: number): Promise<SearchResult[]> {
  await connectDb();

  const [queryEmbedding] = await embedTexts([query]);

  if (!queryEmbedding) {
    throw new Error("Failed to create query embedding");
  }

  const pipeline = [
    {
      $vectorSearch: {
        index: config.VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: Math.max(topK * 10, 50),
        limit: topK,
      },
    },
    {
      $project: {
        _id: 0,
        id: 1,
        docId: 1,
        title: 1,
        source: 1,
        content: 1,
        chunkIndex: 1,
        uuid: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ];

  const results = await RagChunk.collection.aggregate(pipeline).toArray();


  //console.log(results);

  return results.map((result) => ({
    id: String(result.id),
    docId: String(result.docId),
    title: String(result.title),
    source: String(result.source),
    content: String(result.content),
    chunkIndex: Number(result.chunkIndex),
    uuid: String(result.uuid),
    score: Number(result.score ?? 0),
  }));
}

function buildContext(results: SearchResult[]): string {
  return results
    .map((result) => `[${result.id}]\n${result.content.trim()}`)
    .join("\n\n");
}

function buildRetrievalQuery(question: string, history: ChatTurn[] = []): string {
  const recentTurns = history.slice(-4);

  return [
    ...recentTurns.map((turn) => `${turn.role}: ${turn.content}`),
    `user: ${question}`,
  ].join("\n");
}

function buildConversationTranscript(history: ChatTurn[]): string {
  return history
    .slice(-6)
    .map((turn) => `${turn.role.toUpperCase()}: ${turn.content.trim()}`)
    .join("\n\n");
}

function buildLlmInput(transcript: string | null, question: string, context: string) {
  return [
    {
      role: "user" as const,
      content: [
        {
          type: "input_text" as const,
          text: `Recent conversation:
${transcript || "(none)"}

Current user message:
${question}

Relevant context:
${context}`,
        },
      ],
    },
  ];
}

export async function createStreamingLLM(transcript: string, question: string, context: string ): Promise<AsyncIterable<ResponseStreamEvent>> {
  const input = buildLlmInput(transcript, question, context);

  const stream = await client.responses.create({
    model: config.CHAT_MODEL,
    // Beispiel:
    // "openai/gpt-oss-120b:groq"
    // "meta-llama/Llama-3.1-8B-Instruct"
    // "Qwen/Qwen2.5-72B-Instruct:fireworks"
    stream: true,
    instructions: prompts.dialogInstructions,
    input: input
  });

  return stream;
}

async function createNonStreamingLLM(transcript: string | null, question: string, context: string) {
  const input = buildLlmInput(transcript, question, context);

  return client.responses.create({
    model: config.CHAT_MODEL,
    stream: false,
    instructions: prompts.dialogInstructions,
    input,
  });
}


async function streamAnswerOld(question: string, history: ChatTurn[], res: Response) {
  const retrievalQuery = buildRetrievalQuery(question, history);
  const results = await search(retrievalQuery, config.TOP_K);
  const context = buildContext(results);
  const transcript = buildConversationTranscript(history);

  const stream = await createStreamingLLM(transcript, question, context);

  let fullText = "";

  for await (const event of stream) {
    if (event.type === "response.output_text.delta") {
      const delta = event.delta ?? "";
      fullText += delta;

      res.write(
        JSON.stringify({
          type: "delta",
          delta,
        }) + "\n",
      );
    }

    if (event.type === "response.output_text.done") {
      fullText = event.text;
    }
  }

  const answerData: answerType = {
    answer: fullText.trim(),
    sources: results.map((result) => ({
      id: result.id,
      docId: result.docId,
      title: result.title,
      source: result.source,
      content: result.content,
      chunkIndex: Number(result.chunkIndex),
      uuid: result.uuid,
      score: Number(result.score.toFixed(4)),
    })),
  };

  //console.log(results);


  const validatedResponse = answerSchema.parse(answerData);

  res.write(
    JSON.stringify({
      type: "done",
      answer: validatedResponse.answer,
      sources: validatedResponse.sources,
    }) + "\n",
  );

  res.end();
}


async function streamAnswer(question: string, history: ChatTurn[], res: Response) {
  const retrievalQuery = buildRetrievalQuery(question, history);
  const results = await search(retrievalQuery, config.TOP_K);
  const context = buildContext(results);
  const transcript = buildConversationTranscript(history);

  const stream = await createStreamingLLM(transcript, question, context);

  let fullText = "";



  for await (const event of stream) {
    if (event.type === "response.output_text.delta") {
      const delta = event.delta ?? "";
      fullText += delta;

      res.write(
        JSON.stringify({
          type: "delta",
          delta,
        }) + "\n",
      );
    }

      if (event.type === "response.output_text.done") {
    fullText = event.text ?? fullText;
  }

  if (event.type === "error") {
    throw new Error(event.message || "Streaming failed");
  }

  }



  const answerData: answerType = {
    answer: fullText.trim(),
    sources: results.map((result) => ({
      id: result.id,
      docId: result.docId,
      title: result.title,
      source: result.source,
      content: result.content,
      chunkIndex: Number(result.chunkIndex),
      uuid: result.uuid,
      score: Number(result.score.toFixed(4)),
    })),
  };

  //console.log(results);

  const validatedResponse = answerSchema.parse(answerData);

  res.write(
    JSON.stringify({
      type: "done",
      answer: validatedResponse.answer,
      sources: validatedResponse.sources,
    }) + "\n",
  );

  res.end();
}


async function listModels() {
  const models = await client.models.list();
  console.log("\n=== AVAILABLE MODELS ===\n");
  for (const model of models.data) {
    console.log(model.id);
  }
}

async function answer(question: string) {
  const results = await search(question, config.TOP_K);
  const context = buildContext(results);

  const response = await createNonStreamingLLM(null, question, context);

  console.log("\n=== ANSWER ===\n");
  console.log(response.output_text);

  console.log("\n=== SOURCES ===\n");
  results.forEach((result, index) => {
    console.log(
      `[Source ${index + 1}] score=${result.score.toFixed(4)} title="${result.title}" chunk=${result.chunkIndex} chunkid=${result.uuid}`,
    );
  });

  const answerData: answerType = {
    answer: response.output_text.trim(),
    sources: results.map((result) => ({
      id: result.id,
      docId: result.docId,
      title: result.title,
      source: result.source,
      content: result.content,
      chunkIndex: Number(result.chunkIndex),
      uuid: result.uuid,
      score: Number(result.score.toFixed(4)),
    })),
  };

  return answerSchema.parse(answerData);
}

export { listModels, answer, streamAnswer};

export { buildIndex } from "./rag_import.js";

export { disconnectDb } from "./db.js";