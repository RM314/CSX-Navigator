import type { ChatMessage } from '../../types';
import { getBubbleClass } from '../../utils';
import { SourceChips } from './SourceChips';

type MessageBubbleProps = {
  message: ChatMessage;
  selectedSource: string | null;
  onSelectSource: (source: string) => void;
};

export function MessageBubble({
  message,
  selectedSource,
  onSelectSource,
}: MessageBubbleProps) {
  const rowClass = message.role === 'user' ? 'justify-end' : 'justify-start';
  const bubbleClass = getBubbleClass(message.role, message.streaming);
  return (
    <div className={`flex ${rowClass}`}>
      <div className={bubbleClass}>
        <span className="mb-1.5 block text-[0.82rem] font-bold text-[#6b7280]">
          {message.meta}
        </span>
        <div>{message.content}</div>

        {message.sources ? (
          <SourceChips
            sources={message.sources}
            selectedSource={selectedSource}
            onSelectSource={onSelectSource}
          />
        ) : null}
      </div>
    </div>
  );
}
