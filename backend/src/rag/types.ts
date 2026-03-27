import { z } from 'zod';


export type SourceDocument = {
  id: string;
  title: string;
  source: string;
  content: string;
};

export type Chunk = {
  id: string;
  docId: string;
  title: string;
  source: string;
  text: string;
  chunkIndex: number;
};

export type IndexedChunk = Chunk & {
  embedding: number[];
};

export type SearchResult = IndexedChunk & {
  score: number;
};




export const answerSchema = z.object({

    answer: z.string().min(10, "answer should have at least 10 letters"),
    sources: z.array(
        z.object({
            score: z.number().min(0).max(10000),
            title: z.string(),
            chunkIndex: z.number().int().nonnegative(),
    })
  ).default([])
});

export type answerType = z.infer<typeof answerSchema>;

