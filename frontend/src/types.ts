import type { chunkType } from '../../shared/raq/types'

export type MessageRole = 'system' | 'user' | 'assistant';


export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  meta: string;
  sources?: chunkType[];
  streaming?: boolean;
};

export type DocumentItem = {
  id: number;
  title: string;
  author: string;
  type: string;
};
