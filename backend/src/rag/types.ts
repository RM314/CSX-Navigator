import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";

import { config } from "../config/env.js";

const documentSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    source: { type: String, required: true },
    mimeType: { type: String, required: true, default: "text/plain" },
    fileName: { type: String, required: true },
    file: {
      mimeType: { type: String, required: true },
      data: { type: Buffer, required: true }, // original file data; useful for PDFs, for texts useless
    },
    extractedText: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: config.DOCUMENTS_COLLECTION,
  },
);

documentSchema.index({ title: 1 });

const chunkSchema = new Schema(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "RagDocument",
      required: true,
      index: true,
    },
    id: { type: String, required: true },
    docId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    source: { type: String, required: true },
    content: { type: String, required: true },
    chunkIndex: { type: Number, required: true, min: 0 },
    uuid: { type: String, required: true, unique: true, index: true },
    embedding: { type: [Number], required: true },
  },
  {
    timestamps: true,
    collection: config.CHUNKS_COLLECTION,
  },
);

chunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });

type RagDocumentDb = InferSchemaType<typeof documentSchema> & {
  _id: mongoose.Types.ObjectId;
};

type RagChunkDb = InferSchemaType<typeof chunkSchema> & {
  _id: mongoose.Types.ObjectId;
};

const RagDocument = model("RagDocument", documentSchema);
const RagChunk = model("RagChunk", chunkSchema);

export { documentSchema, chunkSchema, RagDocument, RagChunk };
export type { RagDocumentDb, RagChunkDb };