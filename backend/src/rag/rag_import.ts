import * as fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
//import mongoose, { InferSchemaType, Schema, model } from "mongoose";

import {connectDb,disconnectDb,  ensureVectorIndex } from "./db.js";

import { documentSchema, chunkSchema, RagDocument, RagChunk }  from "./types.js";
import type { RagDocumentDb, RagChunkDb, RagDocumentInput }  from "./types.js";
import { file } from "zod";
import  {splitIntoChunksWithLangChain, replaceChunksForDocument} from "./chunks.js"
import { config } from "../config/env.js";

// === Helpers ======================

// make hash a bit more robust against
function normalizeForHash(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hashText(text: string): string {
  return crypto
    .createHash("sha256")
    .update(normalizeForHash(text), "utf8")
    .digest("hex");
}

function getMimeTypeFromExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".md") return "text/markdown";
  if (ext === ".txt") return "text/plain";
  if (ext === ".pdf") return "application/pdf";

  return "application/octet-stream";
}

function isSupportedKnowledgeFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ext === ".txt" || ext === ".md";
}

// ==== Load one File ================

async function loadKnowledgeDocument( filePath: string ): Promise<RagDocumentInput | null> {
  if (!isSupportedKnowledgeFile(filePath)) {
    return null;
  }

  const extractedText = await fs.readFile(filePath, "utf8");
  const fileData = await fs.readFile(filePath); // ist hier natürlich doppelt, wird später passendes pdf
  const fileName = path.basename(filePath);
  const mimeType = getMimeTypeFromExtension(filePath);

  return {
    id: path.parse(filePath).name,
    title: path.parse(filePath).name,
    source: filePath,
    mimeType,
    fileName,
    file: {
      mimeType,
      data: fileData,
    },
    extractedText,
    contentHash: hashText(extractedText),
  };
}

// === DB-Access ====================
/*
async function getSourceDocumentBySlug(
  slug: string,
): Promise<RagDocumentDb | null> {
  return RagDocument.findOne({ slug });
}
  */

async function upsertSourceDocument( doc: RagDocumentInput ): Promise<RagDocumentDb> {
  const result = await RagDocument.findOneAndUpdate(
    { id: doc.id },
    doc,
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  if (!result) {
    throw new Error(`Failed to upsert document "${doc.id}"`);
  }

  return result;
}

// ===== Import one file ======

async function indexDocumentFile(filePath: string): Promise<void> {
  const doc = await loadKnowledgeDocument(filePath);

  if (!doc) {
    console.log(`Skipping unsupported file: ${filePath}`);
    return;
  }

  const existing = await RagDocument.findOne({ id: doc.id });

  if (existing?.contentHash === doc.contentHash) {
    console.log(`Unchanged: ${doc.id}`);
    return;
  }

  if (!existing) {
    console.log(`New: ${doc.id}`);
  } else if (!existing.contentHash) {
    console.log(`Missing hash, reimporting: ${doc.id}`);
  } else {
    console.log(`Changed: ${doc.id}`);
  }

  const documentRecord = await upsertSourceDocument(doc);
  const chunks = await splitIntoChunksWithLangChain(documentRecord);

  console.log(`Created ${chunks.length} chunks for ${documentRecord.title}`);
  await replaceChunksForDocument(documentRecord, chunks);
}

/* =========================
   Import eines ganzen Ordners
   ========================= */

async function indexKnowledgeDirectory(dirPath: string): Promise<void> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const filePath = path.join(dirPath, entry.name);
    await indexDocumentFile(filePath);
  }
}

/* =========================
   Komfortfunktion: kompletter Build
   ========================= */

async function buildIndex(): Promise<void> {
  await connectDb();

  console.log(`Base URL: ${config.LLM_BASE_URL}`);
  console.log(`Embedding model: ${config.EMBEDDING_MODEL}`);

  await indexKnowledgeDirectory(config.KNOWLEDGE_DIR);

  await ensureVectorIndex();

  console.log(
    `MongoDB-backed RAG index is ready in ${config.DB_NAME}.${config.CHUNKS_COLLECTION}`,
  );
}

async function rebuildRagChunks(): Promise<void> {
  await connectDb();

  console.log(`Base URL: ${config.LLM_BASE_URL}`);
  console.log(`Embedding model: ${config.EMBEDDING_MODEL}`);

  const documents = await RagDocument.find();

  console.log(`Rebuilding RAG chunks for ${documents.length} documents from DB`);

  for (const document of documents) {
    const chunks = await splitIntoChunksWithLangChain(document);
    await replaceChunksForDocument(document, chunks);

    console.log(`Rebuilt ${chunks.length} chunks for ${document.title}`);
  }

  await ensureVectorIndex();

  console.log(
    `MongoDB-backed RAG chunks are ready in ${config.DB_NAME}.${config.CHUNKS_COLLECTION}`,
  );
}

export { indexDocumentFile, indexKnowledgeDirectory, buildIndex, rebuildRagChunks };

