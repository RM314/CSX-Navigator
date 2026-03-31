import { useState } from 'react';
import { INITIAL_MESSAGES } from '../../data';
import type { ChatMessage } from '../../types';
import { wait } from '../../utils';
import { ChatComposer } from './ChatComposer';
import { ChatMessages } from './ChatMessages';
import { ContextPanel } from './ContextPanel';

import { type answerType, type chunkType} from '../../rag/types';


const baseUrl = import.meta.env.VITE_API_BASE_URL;

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [selectedSource, setSelectedSource] = useState<string | null>(
    'Community kitchen case study',
  );
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [chunksById, setchunksById] = useState<Record<number, chunkType>>({});

  //const [sourcesValue, setSourcesValue] = useState<sourceType[]>([]);

  const streamAssistantMessage = async (answer: answerType) => {
    const fullText = answer.answer;
    const parts = fullText.match(/.{1,18}(\s|$)/g) || [fullText];

    let assistantIndex = -1;

    setMessages((prev) => {
      assistantIndex = prev.length;
      return [
        ...prev,
        {
          role: 'assistant',
          content: '',
          meta: 'Assistant',
          streaming: true,
        },
      ];
    });

    for (const part of parts) {
      await wait(120);

      setMessages((prev) =>
        prev.map((message, index) =>
          index === assistantIndex
            ? { ...message, content: message.content + part }
            : message,
        ),
      );
    }


    //console.log(answer.sources);

    setMessages((prev) =>
      prev.map((message, index) =>
        index === assistantIndex
          ? {
              ...message,
              streaming: false,
              //sources: ['Shared space example', 'Local habit formation'],
              sources: answer.sources.map((s,index) => `${index+1} ${s.title}`)
            }
          : message,
      ),
    );
  };

/*
return items.map((item, index) => ({
    ...item,
    title: `${item.title}-${index + 1}`,
  }));
*/

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isSending) return;

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: text,
        meta: 'You',
      },
    ]);
    setInputValue('');
    setIsSending(true);

    //const fakeAnswer =
    //  'One example would be a shared neighborhood workshop or kitchen. Once such a place exists, people do not only meet there physically, they also begin to coordinate routines around it. They may repair objects together, cook together, exchange tools, or organize regular events. In that way, the space supports new local habits by making repeated collective action easier.';

    console.log("fetching ",`${baseUrl}/api/chat`)
    const res = await fetch(`${baseUrl}/api/chat`
      , {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });

    const data = await res.json();

    //const fakeAnswer=data.answer;

    setchunksById((prev) => ({
      ...prev,
      ...Object.fromEntries(data.sources.map((src: chunkType) => [src.chunkIndex, src])),
    }));

    console.log("Halleluja1");
    console.log(chunksById);
    console.log("Halleluja2");
    console.log(data.sources);
    console.log("Halleluja3");


    await streamAssistantMessage(data);

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content:
          'Do you want a more concrete example from agriculture, culture, or urban neighborhoods?',
        meta: 'Assistant follow-up',
      },
    ]);

    setIsSending(false);
  };

  return (
    <section className="grid grid-cols-[220px_1fr] gap-5 max-[900px]:grid-cols-1">
      <ContextPanel selectedSource={selectedSource} chunksById={chunksById} />

      <section className="grid min-h-[calc(100vh-140px)] grid-rows-[auto_1fr_auto] overflow-hidden rounded-[24px] border border-[#d8e0ea] bg-white shadow-[0_16px_36px_rgba(31,41,55,0.08)]">
        <header className="flex items-center justify-between gap-4 border-b border-[#d8e0ea] px-[22px] py-5">
          <div>
            <h2 className="m-0 text-[1.2rem] font-semibold text-[#1f2937]">
              Chat
            </h2>
            <p className="mt-1 text-[0.92rem] text-[#6b7280]">
              Knowledge-guided answers with follow-up questions and source hints.
            </p>
          </div>

          <div className="rounded-full bg-[#eef3f8] px-3 py-2 text-[0.85rem] font-semibold text-[#6b7280]">
            Streaming enabled
          </div>
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
