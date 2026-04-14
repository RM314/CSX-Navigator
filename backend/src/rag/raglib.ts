import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import OpenAI from "openai";
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import type { Response } from "express";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { config } from "../config/env.js";
import {
  type ChatTurn,
  type SourceDocument,
  type Chunk,
  type SearchResult,
  type answerType,
  answerSchema,
} from "../../../shared/raq/types.js";
import * as prompts from "./prompts.js";

import { documentSchema, chunkSchema, RagDocument, RagChunk } from "./types.js";
import type { RagDocumentDb, RagChunkDb } from "./types.js";

const client = new OpenAI({
  baseURL: config.LLM_BASE_URL,
  apiKey: config.LLM_API_KEY,
});



let mongoConnectionPromise: Promise<typeof mongoose> | null = null;

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: Number(config.RAG_CHUNK_SIZE),
  chunkOverlap: Number(config.RAG_CHUNK_OVERLAP),
});

async function connectDb() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(config.MONGODB_URI, {
      dbName: config.DB_NAME,
      autoIndex: true,
    });
  }

  return mongoConnectionPromise;
}

async function disconnectDb() {
  await mongoose.disconnect();
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function loadKnowledgeDocuments(): Promise<SourceDocument[]> {
  const entries = await fs.readdir(config.KNOWLEDGE_DIR, { withFileTypes: true });
  const docs: SourceDocument[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".txt") && !entry.name.endsWith(".md")) continue;

    const fullPath = path.join(config.KNOWLEDGE_DIR, entry.name);
    const content = await fs.readFile(fullPath, "utf8");
    const title = entry.name.replace(/\.(txt|md)$/i, "");

    docs.push({
      id: slugify(title),
      title,
      source: fullPath,
      content: normalizeWhitespace(content),
    });
  }

  if (docs.length === 0) {
    throw new Error(`No .txt or .md files found in ${config.KNOWLEDGE_DIR}`);
  }

  return docs;
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  const response = await client.embeddings.create({
    model: config.EMBEDDING_MODEL,
    input: texts,
    encoding_format: "float",
  });

  return response.data.map((item) => item.embedding);
}

async function splitIntoChunksWithLangChain(
  doc: SourceDocument,
): Promise<Chunk[]> {

  const splitDocs = await textSplitter.createDocuments([doc.content]);
  const mappedChunks = splitDocs.map((splitDoc, chunkIndex) => {
  const chunkText = normalizeWhitespace(splitDoc.pageContent);

  if (!chunkText) {
    return null;
  }

  const chunk: Chunk = {
    id: `${doc.id}::${chunkIndex}`,
    docId: doc.id,
    title: doc.title,
    source: doc.source,
    content: chunkText,
    chunkIndex,
    uuid: crypto.randomUUID(),
  };

  return chunk;
});

const validChunks = mappedChunks.filter(
  (chunk): chunk is Chunk => chunk !== null,
);

return validChunks;
}

// update and/or insert
async function upsertSourceDocument(doc: SourceDocument): Promise<RagDocumentDb> {
  const sourceBuffer = await fs.readFile(doc.source);
  const fileName = path.basename(doc.source);
  const mimeType = fileName.endsWith(".md") ? "text/markdown" : "text/plain";

  const result = await RagDocument.findOneAndUpdate(
    { slug: doc.id },
    {
      $set: {
        slug: doc.id,
        title: doc.title,
        source: doc.source,
        mimeType,
        fileName,
        file: {
          mimeType,
          data: sourceBuffer,
        },
        extractedText: doc.content,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      lean: true,
    },
  );

  if (!result) {
    throw new Error(`Failed to upsert source document: ${doc.title}`);
  }

  return result as RagDocumentDb;
}

async function replaceChunksForDocument(
  documentRecord: RagDocumentDb,
  chunks: Chunk[],
) {
  await RagChunk.deleteMany({ documentId: documentRecord._id });

  if (chunks.length === 0) {
    return;
  }

  const batchSize = 64;
  const insertDocs: Array<Omit<RagChunkDb, "_id">> = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embeddings = await embedTexts(batch.map((chunk) => chunk.content));

    if (embeddings.length !== batch.length) {
      throw new Error(
        `Embedding count mismatch: got ${embeddings.length}, expected ${batch.length}`,
      );
    }

    embeddings.forEach((embedding, index) => {
      const chunk = batch[index];
      if (!chunk) {
        throw new Error(`Missing chunk at batch index ${index}`);
      }

      insertDocs.push({
        documentId: documentRecord._id,
        id: chunk.id,
        docId: chunk.docId,
        title: chunk.title,
        source: chunk.source,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        uuid: chunk.uuid,
        embedding,
      } as Omit<RagChunkDb, "_id">);
    });

    console.log(`Embedded ${Math.min(i + batch.length, chunks.length)} / ${chunks.length} chunks for ${documentRecord.title}`);
  }

  if (insertDocs.length > 0) {
    await RagChunk.insertMany(insertDocs, { ordered: false });
  }
}

async function ensureVectorIndex() {
  const collection = RagChunk.collection;
  const existingIndexes = await collection.listSearchIndexes().toArray();
  const exists = existingIndexes.some((index) => index.name === config.VECTOR_INDEX_NAME);

  if (exists) {
    return;
  }

  await collection.createSearchIndex({
    name: config.VECTOR_INDEX_NAME,
    type: "vectorSearch",
    definition: {
      fields: [
        {
          type: "vector",
          path: "embedding",
          similarity: "cosine",
          numDimensions: config.EMBEDDING_DIMENSIONS,
        },
      ],
    },
  });
}

async function buildIndex() {
  await connectDb();
  const docs = await loadKnowledgeDocuments();

  console.log(`Base URL: ${config.LLM_BASE_URL}`);
  console.log(`Embedding model: ${config.EMBEDDING_MODEL}`);
  console.log(`Loaded ${docs.length} documents from ${config.KNOWLEDGE_DIR}`);

  for (const doc of docs) {
    const documentRecord = await upsertSourceDocument(doc);
    const chunks = await splitIntoChunksWithLangChain(doc);
    console.log(`Created ${chunks.length} chunks for ${doc.title}`);
    await replaceChunksForDocument(documentRecord, chunks);
  }

  await ensureVectorIndex();
  console.log(`MongoDB-backed RAG index is ready in ${config.DB_NAME}.${config.CHUNKS_COLLECTION}`);
}

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

async function createStreamingLLM(transcript: string | null, question: string, context: string) {
  const input = buildLlmInput(transcript, question, context);

  return client.responses.create({
    model: config.CHAT_MODEL,
    stream: true,
    instructions: prompts.dialogInstructions,
    input,
  });
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

export { buildIndex, listModels, answer, streamAnswer, search, RagDocument, RagChunk, disconnectDb };
