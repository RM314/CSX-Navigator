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

//
async function loadKnowledgeDocument( txtFilePath: string, mediaFilePath: string | null): Promise<RagDocumentInput | null> {
  if (!isSupportedKnowledgeFile(txtFilePath)) {
    return null;
  }

  const extractedText = await fs.readFile(txtFilePath, "utf8");
  const fileData = (mediaFilePath) ? await fs.readFile(mediaFilePath) : Buffer.alloc(0);
  const fileName = path.basename( (mediaFilePath) ? mediaFilePath : txtFilePath);
  const mimeType = getMimeTypeFromExtension((mediaFilePath) ? mediaFilePath : txtFilePath);

  //console.log(`loaded ${txtFilePath} - ${mediaFilePath ? mediaFilePath : 'no media helper file'}`);
  console.log(`loaded ${txtFilePath} - ${mediaFilePath}`);

  return {
    id: path.parse(mediaFilePath ? mediaFilePath : txtFilePath).name,
    title: path.parse(mediaFilePath ? mediaFilePath : txtFilePath).name,
    source: txtFilePath,
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

async function indexDocumentFile(txtFilePath: string, mediaFilePath: string | null): Promise<void> {
  const doc = await loadKnowledgeDocument(txtFilePath, mediaFilePath);

  if (!doc) {
    console.log(`Skipping unsupported file pair: ${txtFilePath} - ${mediaFilePath}`);
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

function isMainFile(fileName: string): boolean {
  return fileName.endsWith(".txt") || fileName.endsWith(".md");
}

function isHelpFile(fileName: string): boolean {
  return fileName.endsWith(".pdf");
}

function getBaseName(fileName: string): string {
  return path.parse(fileName).name;
}

const MAIN_EXTENSIONS = new Set([".txt", ".md"]);
const HELP_EXTENSIONS = new Set([".pdf"]);

async function indexKnowledgeDirectory(dirPath: string): Promise<void> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);

//  console.log(files)

  const groups = new Map<string, { mainFiles: string[]; helpFiles: string[];} >();

  for (const file of files) {
    const { name: baseName, ext } = path.parse(file);

    const group = groups.get(baseName) ?? { mainFiles: [], helpFiles: [] };

    if (MAIN_EXTENSIONS.has(ext)) {
      group.mainFiles.push(file);
    } else if (HELP_EXTENSIONS.has(ext)) {
      group.helpFiles.push(file);
    }

    groups.set(baseName, group);
  }

  //console.log(groups);


  for (const [baseName, group] of groups) {
    if (group.mainFiles.length === 0) continue;

    if (group.mainFiles.length > 1) {
      throw new Error(
        `Only one main file is allowed for "${baseName}", but found: ${group.mainFiles.join(", ")}`,
      );
    }

    if (group.helpFiles.length > 1) {
      throw new Error(
        `Only one help file is allowed for "${baseName}", but found: ${group.helpFiles.join(", ")}`,
      );
    }

    //console.log(group)

    const [mainFile] = group.mainFiles;
    if (!mainFile) { continue; }

    const [helpFile] = group.helpFiles;

    const mainFilePath = path.join(dirPath, mainFile);
    const helpFilePath = helpFile ? path.join(dirPath, helpFile) : null;

    //console.log(mainFilePath, helpFilePath);


    await indexDocumentFile(mainFilePath, helpFilePath);
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

