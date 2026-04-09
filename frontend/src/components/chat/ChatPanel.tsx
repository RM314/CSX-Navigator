import { useState } from 'react';
import { INITIAL_MESSAGES } from '../../data';
import type { ChatMessage } from '../../types';
//import { wait } from '../../utils';
import { ChatComposer } from './ChatComposer';
import { ChatMessages } from './ChatMessages';
import { ContextPanel } from './ContextPanel';

import { type chunkType, type ChatTurn} from '../../../../shared/raq/types'


const baseUrl = import.meta.env.VITE_API_BASE_URL;

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [selectedSource, setSelectedSource] = useState<string | null>(
    'Community kitchen case study',
  );
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [chunksById, setChunksById] = useState<Record<string, chunkType>>({});

  //const setChunksById: Record<string, chunkType> = {};

  //const [sourcesValue, setSourcesValue] = useState<sourceType[]>([]);


async function readChatStream(
  res: Response,
  onDelta: (delta: string) => void,
  onDone: (payload: { answer: string; sources: chunkType[] }) => void,
) {
  if (!res.body) {
    throw new Error("Response body is missing");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;

      const msg = JSON.parse(line);

      if (msg.type === "delta") {
        onDelta(msg.delta);
      } else if (msg.type === "done") {
        onDone({
          answer: msg.answer,
          sources: msg.sources,
        });
      } else if (msg.type === "error") {
        throw new Error(msg.message ?? "Streaming failed");
      }
    }
  }
}

function isChatTurnMessage( message: ChatMessage): message is ChatMessage & { role: "user" | "assistant" } {
  return (
    (message.role === "user" || message.role === "assistant") &&
    message.content.trim().length > 0
  );
}


function buildHistory(messages: ChatMessage[]): ChatTurn[] {
  return messages
    .filter(isChatTurnMessage)
    .slice(-6)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}


const sendMessage = async (text: string) => {
  const assistantId = crypto.randomUUID();
  const userSId = crypto.randomUUID();

   setMessages((prev) => [
      ...prev,
      {
        id: userSId,
        role: 'user',
        content: text,
        meta: 'You',
      },
    ]);

  setMessages((prev) => [
    ...prev,
    {
      id: assistantId,
      role: "assistant",
      content: "",
      meta: "Assistant",
      streaming: true,
      sources: [],
    },
  ]);

   const history = buildHistory(messages);

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    await readChatStream(
      res,
      (delta) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + delta }
              : message,
          ),
        );
      },
      ({ answer, sources }) => {
        setChunksById((prev) => ({
          ...prev,
          ...Object.fromEntries(sources.map((src) => [src.uuid, src])),
        }));

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: answer,
                  sources,
                  streaming: false,
                }
              : message,
          ),
        );
      },
    );
  } catch (error) {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === assistantId
          ? {
              ...message,
              streaming: false,
              content:
                message.content || "Fehler beim Empfangen der Antwort.",
            }
          : message,
      ),
    );

    throw error;
  } finally {
    setIsSending(false);
  }
};


const handleSend = async () => {
  const text = inputValue.trim();
  if (!text || isSending) return;

  setInputValue("");
  setIsSending(true);
  await sendMessage(text);

};


  return (
  <section className="grid h-[calc(100vh-140px)] grid-cols-[fit-content(320px)_1fr] gap-5">
    <ContextPanel selectedSource={selectedSource} chunksById={chunksById} />

    <section className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden rounded-[24px] border border-[#d8e0ea] bg-white shadow-[0_16px_36px_rgba(31,41,55,0.08)]">
      <header className="flex items-center justify-between gap-4 border-b border-[#d8e0ea] px-[22px] py-5">
        <div>
          <h2 className="m-0 text-[1.2rem] font-semibold text-[#1f2937]">
            Chat
          </h2>
          <p className="mt-1 text-[0.92rem] text-[#6b7280]">
            Knowledge-guided answers with {/*follow-up questions and*/} source hints.
          </p>
        </div>

        { /*}
        <div className="rounded-full bg-[#eef3f8] px-3 py-2 text-[0.85rem] font-semibold text-[#6b7280]">
          Streaming enabled
        </div>
        */}
      </header>

      <ChatMessages
        messages={messages}
        selectedSource={selectedSource}
        onSelectSource={setSelectedSource}
      />

      <ChatComposer
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        disabled={isSending}
      />
    </section>
  </section>
);
}
