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

import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

import { config } from '../config/env.js';

const KNOWLEDGE_DIR = path.resolve("knowledge");
const INDEX_FILE = path.resolve("data", "rag-index.json");
const CHUNK_SIZE = 500; // 900
const CHUNK_OVERLAP = 100; // 150
const TOP_K = 4;

import {
  type SourceDocument,
  type Chunk,
  type IndexedChunk,
  type SearchResult,
  type answerType,
  answerSchema,
} from "../../../shared/raq/types.js";

const client = new OpenAI({
  baseURL: config.LLM_BASE_URL,
  apiKey: config.LLM_API_KEY,
});

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function loadKnowledgeDocuments(): Promise<SourceDocument[]> {
  const entries = await fs.readdir(KNOWLEDGE_DIR, { withFileTypes: true });
  const docs: SourceDocument[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".txt") && !entry.name.endsWith(".md")) continue;

    const fullPath = path.join(KNOWLEDGE_DIR, entry.name);
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
    throw new Error(`No .txt or .md files found in ${KNOWLEDGE_DIR}`);
  }

  return docs;
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\r/g, "").replace(/\t/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

// todo - umlaute
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function splitIntoChunks(doc: SourceDocument): Chunk[] {
  const text = doc.content;
  const chunks: Chunk[] = [];

  let start = 0;
  let chunkIndex = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf("\n\n", end);
      const sentenceBreak = text.lastIndexOf(". ", end);
      const spaceBreak = text.lastIndexOf(" ", end);
      end = Math.max(paragraphBreak, sentenceBreak, spaceBreak, start + 200);
    }

    const chunkText = text.slice(start, end).trim();

    if (chunkText.length > 0) {
      chunks.push({
        id: `${doc.id}::${chunkIndex}`,
        docId: doc.id,
        title: doc.title,
        source: doc.source,
        content: chunkText,
        chunkIndex,
        uuid: crypto.randomUUID()
      });
      chunkIndex += 1;
    }

    if (end >= text.length) break;
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}

async function embedTexts(texts: string[]): Promise<number[][]> {
    //console.log(texts);
  const response = await client.embeddings.create({
    model: config.EMBEDDING_MODEL,
    input: texts,
    encoding_format: "float",
  });

  //console.log(response.data);
  //console.dir(response.data, { depth: null });

  console.log("embedding dimension: ",response.data[0]?.embedding.length);

  return response.data.map((item) => item.embedding);
}

async function buildIndex() {
  await ensureDir(path.dirname(INDEX_FILE));

  const docs = await loadKnowledgeDocuments();
  const chunks = docs.flatMap(splitIntoChunks);

  console.log(`Base URL: ${config.LLM_BASE_URL}`);
  console.log(`Embedding model: ${config.EMBEDDING_MODEL}`);
  console.log(`Loaded ${docs.length} documents`);
  console.log(`Created ${chunks.length} chunks`);

  const indexedChunks: IndexedChunk[] = [];
  const batchSize = 64;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    //console.log(batch);

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
      indexedChunks.push({
        ...chunk,
        embedding,
      });
    });

    console.log(`Embedded ${Math.min(i + batch.length, chunks.length)} / ${chunks.length}`);
  }

  await fs.writeFile(INDEX_FILE, JSON.stringify(indexedChunks, null, 2), "utf8");
  console.log(`Saved index to ${INDEX_FILE}`);
}

async function loadIndex(): Promise<IndexedChunk[]> {
  const raw = await fs.readFile(INDEX_FILE, "utf8");
  return JSON.parse(raw) as IndexedChunk[];
}

function dot(a: number[], b: number[]): number {
    if (a.length !== b.length) {
    throw new Error("dot: vectors must have the same length");
    }
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += a[i]! * b[i]!;
  return sum;
}

function magnitude(vector: number[]): number {
  return Math.sqrt(dot(vector, vector));
}

function cosineSimilarity(a: number[], b: number[]): number {
  const denom = magnitude(a) * magnitude(b);
  if (denom === 0) return 0;
  return dot(a, b) / denom;
}

async function search(query: string, topK = TOP_K): Promise<SearchResult[]> {
  const index = await loadIndex();
  const [queryEmbedding] = await embedTexts([query]);

   if (!queryEmbedding) { // wg. ts-compiler hauptsächlich
        throw new Error("Failed to create query embedding");
    }

  return index
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function buildContext(results: SearchResult[]): string {
  // nur das minimale
  return results
    .map(
      (result, i) =>
        [
          //`SOURCE ${i + 1}`,
          `SOURCE ${result.id}`,
          `Title: ${result.title}`,
          "Content:",
          result.content,
        ].join("\n")
    )
    .join("\n\n---\n\n");

// Chunk: ${result.chunkIndex}`,
//`UUID: ${result.uuid}`,
//`Path: ${result.source}`,

}

async function answer(question: string) {
  const results = await search(question, TOP_K);
  //console.log("#####################");
  //console.log(results);
  //console.log("#####################");

  const context = buildContext(results);

  const response = await client.responses.create({
    model: config.CHAT_MODEL,
    instructions:
      "You are a CSX knowledge assistant. Answer only from the provided context. If the context is insufficient, say so clearly. Cite sources as [SOURCE_1], [SOURCE_2], [SOURCE_3] etc.. Keep the answer focused and concrete.",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Question:\n${question}\n\nContext:\n${context}`,
          },
        ],
      },
    ],
  });

  console.log("\n=== ANSWER ===\n");
  console.log(response.output_text);

  console.log("\n=== SOURCES ===\n");
  results.forEach((result, index) => {
    console.log(
      `[Source ${index + 1}] score=${result.score.toFixed(4)} title="${result.title}" chunk=${result.chunkIndex} chunkid=${result.uuid}`
    );
  });


    const answerData = {
        answer: response.output_text.trim(),
        sources: results.map((result) => ({
            id: result.id,
            docId: result.docId,
            title: result.title,
            source: result.source,
            content: result.content,
            chunkIndex: Number(result.chunkIndex),
            uuid: result.uuid,
            score: Number(result.score.toFixed(4))
        })),
    };

    /*
    console.log("AFFEXXX1")
    console.log(answerData);
    console.log("AFFEXXX2")
    */

    const validatedResponse = answerSchema.parse(answerData);



    //console.log(validatedResponse);
    return validatedResponse;


}

async function listModels() {
  const models = await client.models.list();
  console.log("\n=== AVAILABLE MODELS ===\n");
  for (const model of models.data) {
    console.log(model.id);
  }
}

 export { buildIndex, answer, listModels };

