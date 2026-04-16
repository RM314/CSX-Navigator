import mongoose from "mongoose";
import { config } from "../config/env.js";

import { RagChunk } from "./types.js";

let mongoConnectionPromise: Promise<typeof mongoose> | null = null;



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

export {connectDb, disconnectDb, ensureVectorIndex };
