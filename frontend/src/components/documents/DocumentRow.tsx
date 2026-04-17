import type { DocumentItem } from '../../types';

type DocumentRowProps = {
  item: DocumentItem;
};

export function DocumentRow({ item }: DocumentRowProps) {

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const mediaUrl = `${API_BASE_URL}/api/documents/${encodeURIComponent(item.id)}/media`;

  return (
    <div className="grid grid-cols-[1.6fr_100px_100px] items-center gap-3 rounded-2xl border border-[#d8e0ea] bg-white p-4 max-[760px]:grid-cols-1">
      <div>
        <div className="font-semibold text-[#1f2937]">{item.title}</div>
        <div className="mt-1 text-sm text-[#6b7280]">
          {item.authors}
        </div>
      </div>



      <button
        type="button"
        className="rounded-xl bg-[#eef3f8] px-3 py-2 text-sm font-semibold text-[#1f2937]"
      >
        Details
      </button>

      {item.hasMedia ? (
        <a
          href={mediaUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-[#eef3f8] px-3 py-2 text-sm font-semibold text-[#1f2937]"
        >
          {item.type}
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-xl bg-[#eef3f8] px-3 py-2 text-sm font-semibold text-[#1f2937] opacity-50"
        >
          Media
        </button>
      )}

      {/*
      <div className="flex justify-start">
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-xl bg-[#fee2e2] px-3 py-2 text-sm font-semibold text-[#b91c1c] opacity-50"
        >
          Delete
        </button>
      </div>
      */}
    </div>
  );
}
