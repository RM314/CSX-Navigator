import { useState } from 'react';
import { INITIAL_DOCUMENTS } from '../../data';
import type { DocumentItem } from '../../types';
import { DocumentRow } from './DocumentRow';

export function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [query, setQuery] = useState('');

  const filteredDocuments = documents.filter((doc) =>
    `${doc.title} ${doc.author}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const handleDelete = (id: number) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const title = file.name.replace(/\.[^.]+$/, '');
    const type = file.name.split('.').pop()?.toUpperCase() || 'FILE';

    setDocuments((prev) => [
      {
        id: Date.now(),
        title,
        author: 'Uploaded just now',
        type,
      },
      ...prev,
    ]);

    event.target.value = '';
  };

  return (
    <section className="rounded-[24px] border border-[#d8e0ea] bg-white shadow-[0_16px_36px_rgba(31,41,55,0.08)]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d8e0ea] px-6 py-5">
        <div>
          <h2 className="text-[1.2rem] font-semibold text-[#1f2937]">Documents</h2>
          <p className="mt-1 text-[0.92rem] text-[#6b7280]">
            Search by title or author, upload files, inspect details, and remove
            documents.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-3 border-b border-[#d8e0ea] px-6 py-4">
        <div className="min-w-[240px] flex-1">
          <label className="mb-1 block text-sm font-medium text-[#1f2937]">
            Search title / author
          </label>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-xl border border-[#d8e0ea] bg-white px-3.5 py-3 outline-none focus:border-[#2f6fed] focus:ring-2 focus:ring-[rgba(47,111,237,0.16)]"
            placeholder="e.g. kitchen, Meyer"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[#1f2937]">
            Upload document
          </label>
          <input
            type="file"
            onChange={handleUpload}
            className="block rounded-xl border border-[#d8e0ea] bg-white px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="p-6">
        {filteredDocuments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8e0ea] bg-[#eef3f8] p-8 text-center text-[#6b7280]">
            No matching documents.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredDocuments.map((item) => (
              <DocumentRow key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
