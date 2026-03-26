import type { DocumentItem } from '../../types';

type DocumentRowProps = {
  item: DocumentItem;
  onDelete: (id: number) => void;
};

export function DocumentRow({ item, onDelete }: DocumentRowProps) {
  return (
    <div className="grid grid-cols-[1.6fr_1fr_100px_180px] items-center gap-3 rounded-2xl border border-[#d8e0ea] bg-white p-4 max-[760px]:grid-cols-1">
      <div>
        <div className="font-semibold text-[#1f2937]">{item.title}</div>
        <div className="mt-1 text-sm text-[#6b7280]">{item.author}</div>
      </div>

      <div className="text-sm text-[#6b7280]">{item.type}</div>

      <button className="rounded-xl bg-[#eef3f8] px-3 py-2 text-sm font-semibold text-[#1f2937]">
        Details
      </button>

      <div className="flex justify-start">
        <button
          onClick={() => onDelete(item.id)}
          className="rounded-xl bg-[#fee2e2] px-3 py-2 text-sm font-semibold text-[#b91c1c]"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
