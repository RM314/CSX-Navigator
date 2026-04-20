import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import type { SourceDocument, Chunk,} from "../shared/types.js";

import {  RagChunk, type RagChunkDb, type RagDocumentDb } from "./types.js";

import { config } from "../config/env.js";

import OpenAI from "openai";

import { client } from "./llm.js";

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: Number(config.RAG_CHUNK_SIZE),
  chunkOverlap: Number(config.RAG_CHUNK_OVERLAP),
});


function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/*
async function splitIntoChunksWithLangChain( doc: SourceDocument): Promise<Chunk[]>  {

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
*/

async function splitIntoChunksWithLangChain(doc: RagDocumentDb): Promise<Chunk[]> {
  const splitDocs = await textSplitter.createDocuments([doc.extractedText]);

  const mappedChunks = splitDocs.map((splitDoc, chunkIndex) => {
      const chunkText = normalizeWhitespace(splitDoc.pageContent);

      if (!chunkText) { return null; }

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
    })
    .filter((chunk): chunk is Chunk => chunk !== null);
  return mappedChunks;
}

async function embedTexts(texts: string[]): Promise<number[][]> {


  const response = await client.embeddings.create({
    model: config.EMBEDDING_MODEL,
    input: texts,
    encoding_format: "float",
  });


  return response.data.map((item) => item.embedding);

}

async function replaceChunksForDocument( documentRecord: RagDocumentDb, chunks: Chunk[]) {
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

export {splitIntoChunksWithLangChain, replaceChunksForDocument, embedTexts};