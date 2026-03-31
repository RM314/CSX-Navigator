
import { type chunkType} from '../../rag/types';


type SourceChipsProps = {
  chunksById: Map<number, chunkType>;
  selectedSource: number | null;
  onSelectSource: (source: number) => void;
};

export function SourceChips({
  chunksById,
  selectedSource,
  onSelectSource,
}: SourceChipsProps) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-2">

      {chunksById.map((chunk) => {
        const active = selectedSource === chunk.chunkIndex;

        return (
          <button
            key={source}
            type="button"
            onClick={() => onSelectSource(source)}
            className={
              active
                ? 'cursor-pointer rounded-full border border-[#2f6fed] bg-[#2f6fed] px-[9px] py-[5px] text-[0.8rem] text-white'
                : 'cursor-pointer rounded-full border border-[#d8e0ea] bg-white px-[9px] py-[5px] text-[0.8rem] text-[#6b7280] hover:border-[#2f6fed] hover:text-[#2f6fed]'
            }
          >
            {source}
          </button>
        );
      })}
    </div>
  );
}
