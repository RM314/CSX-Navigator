import type { chunkType } from '../../shared/raq/types'

export type MessageRole = 'system' | 'user' | 'assistant';


/*
export type SourceChunk = {
  label: string;
  text: string;
};
*/


export type ChatMessage = {
  role: MessageRole;
  content: string;
  meta: string;
  //sources?: string[];
  sources?: chunkType[];
  streaming?: boolean;
};

export type DocumentItem = {
  id: number;
  title: string;
  author: string;
  type: string;
};
