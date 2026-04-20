import { Outlet } from 'react-router-dom';
import { useState } from 'react';

import { INITIAL_MESSAGES } from '../data';
import type { ChatMessage } from '../types';
import type { chunkType } from '../../../shared/raq/types';

export type ChatShellContext = {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  selectedSource: string | null;
  setSelectedSource: React.Dispatch<React.SetStateAction<string | null>>;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  isSending: boolean;
  setIsSending: React.Dispatch<React.SetStateAction<boolean>>;
  chunksById: Record<string, chunkType>;
  setChunksById: React.Dispatch<React.SetStateAction<Record<string, chunkType>>>;
};

export function AppShell() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [selectedSource, setSelectedSource] = useState<string | null>(
    'Community kitchen case study',
  );
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chunksById, setChunksById] = useState<Record<string, chunkType>>({});

  const context: ChatShellContext = {
    messages,
    setMessages,
    selectedSource,
    setSelectedSource,
    inputValue,
    setInputValue,
    isSending,
    setIsSending,
    chunksById,
    setChunksById,
  };

  return <Outlet context={context} />;
}