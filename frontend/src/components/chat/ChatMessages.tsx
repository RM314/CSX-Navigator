import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types';
import { MessageBubble } from './MessageBubble';

type ChatMessagesProps = {
  messages: ChatMessage[];
  selectedSource: string | null;
  onSelectSource: (source: string) => void;
};

export function ChatMessages({
  messages,
  selectedSource,
  onSelectSource,
}: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-[14px] overflow-y-auto bg-[#fbfcfe] p-[22px]  border-2 border-red-500  "
    >
      {messages.map((message, index) => (
        <MessageBubble
          key={`${message.meta}-${index}`}
          message={message}
          selectedSource={selectedSource}
          onSelectSource={onSelectSource}
        />
      ))}
    </div>
  );
}
