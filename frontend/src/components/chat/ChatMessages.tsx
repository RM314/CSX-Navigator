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

 {/*className="flex flex-col gap-[14px] overflow-y-auto bg-[#fbfcfe] p-[22px]  "*/}
  return (
    <div ref={containerRef} className="min-h-0 overflow-y-auto bg-[#fbfcfe] p-[22px]" >
      <div className="flex flex-col gap-[14px]">
        {messages.map((message, index) => (
          <MessageBubble
            key={`${message.meta}-${index}`}
            message={message}
            selectedSource={selectedSource}
            onSelectSource={onSelectSource}
          />
        ))}
      </div>
    </div>
  );
}
