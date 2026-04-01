//import { SOURCE_CHUNKS } from '../../data';

import { type chunkType } from '../../rag/types';

type ContextPanelProps = {
  selectedSource: string | null;
  chunksById: Record<string, chunkType>;
};

export function ContextPanel({ selectedSource, chunksById}: ContextPanelProps) {

  const s = chunksById && selectedSource ? chunksById[selectedSource] : null;

  //console.log("ContextPanel s=",s," selectedSource=",selectedSource," chunksById=",chunksById);

  return (
    <aside className="h-fit rounded-[20px] border border-[#d8e0ea] bg-white p-[18px] shadow-[0_16px_36px_rgba(31,41,55,0.08)]">
      <h3 className="mb-3 text-base font-semibold text-[#1f2937]">Context</h3>

      <ul className="list-disc space-y-1 pl-[18px] leading-6 text-[#6b7280]">
        <li>Topic: Community-supported spaces</li>
        <li>User goal: practical example</li>
        <li>Mode: guided answer</li>
      </ul>

      <div className="mt-[18px] border-t border-[#d8e0ea] pt-[18px]">
        <h4 className="mb-2 text-[0.95rem] font-semibold text-[#1f2937]">
          Selected source chunk
        </h4>
        <div className="mb-2 text-xs text-[#6b7280]">
          {s ? s.title : 'Click a source below a message.'}
        </div>
        <div className="rounded-xl border border-[#d8e0ea] bg-[#eef3f8] p-3 text-[0.92rem] leading-6 text-[#1f2937]">
          {s ? s.content : 'The matching chunk will appear here.'}
        </div>
      </div>
    </aside>
  );
}
