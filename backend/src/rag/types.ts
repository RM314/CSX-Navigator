import { z } from 'zod';


export type SourceDocument = {
  id: string;
  title: string;
  source: string;
  content: string;
};

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


export const chunkSchema = z.object({
  score: z.number().min(0).max(1).optional(),
  //chunkIndex: z.number().int().nonnegative(),
  title: z.string(), // kommt aus dem Dateinamen
  source: z.string(), // full path
  content: z.string(),
  id: z.string(), // reis2025::84 ; geht auch und ist wohl LLM-freundlicher als so eine lange UUID
  uuid: z.uuid(),
  docId: z.string() // ist halt aktuell praktisch nochmal der Bibkey
});

export const answerSchema = z.object({
  answer: z.string().min(10, "answer should have at least 10 letters"),
  sources: z.array(chunkSchema).default([]),
});

export type chunkType = z.infer<typeof chunkSchema>;
export type answerType = z.infer<typeof answerSchema>;

export type Chunk=chunkType;

export type IndexedChunk = Chunk & {
  embedding: number[];
};

export type SearchResult = IndexedChunk & {
  score: number;
};
