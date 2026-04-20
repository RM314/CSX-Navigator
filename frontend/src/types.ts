import type { chunkType } from './shared/types'
import { z } from 'zod';


export type MessageRole = 'system' | 'user' | 'assistant';


export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  meta: string;
  sources?: chunkType[];
  streaming?: boolean;
};

/*
export type DocumentItem = {
  //id: number;
  id: string;
  title: string;
  author: string;
  type: string;
};*/

export type DocumentListItemDTO = {
  id: string;
  title: string;
  authors: string;
  type: string;
  hasMedia: boolean;
};

export const documentItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  type: z.string(),
  hasMedia: z.boolean(),
});

export const documentListSchema = z.array(documentItemSchema);

export type DocumentItem = z.infer<typeof documentItemSchema>;

