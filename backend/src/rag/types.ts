import { z } from 'zod';

/*
export type SourceDocument = {
  id: string;
  title: string;
  source: string;
  content: string;
};
*/

/*
export type UUID = string & { __brand: "uuid" };
export type Chunk = {
  id: UUID;
  docId: string;
  title: string;
  source: string;
  text: string;
  chunkIndex: number;
};
*/

/*
type Chunk = {
  id: string;
  docId: string;
  title: string;
  source: string;
  content: string;
  chunkIndex: number;
  uuid: string;
};
*/

export const chunkSchema = z.object({
  id: z.string(), // reis2025::84 ; geht auch und ist wohl LLM-freundlicher als so eine lange UUID
  docId: z.string(), // ist halt aktuell praktisch nochmal der Bibkey
  title: z.string(), // kommt aus dem Dateinamen
  source: z.string(), // full path
  content: z.string(), // full path
  chunkIndex: z.number().int().nonnegative(),
  uuid: z.uuid(),
  score: z.number().min(0).max(1).optional()
});

export const answerSchema = z.object({
  answer: z.string().min(10, "answer should have at least 10 letters"),
  sources: z.array(chunkSchema).default([]),
});

export type chunkType = z.infer<typeof chunkSchema>;
export type answerType = z.infer<typeof answerSchema>;



// inner types
export type Chunk = chunkType;

export type IndexedChunk = Chunk & {
  embedding: number[];
};

export type SearchResult = IndexedChunk & {
  score: number;
};

type SourceDocument = {
  id: string;
  title: string;
  source: string;
  content: string;
};

