import { useState, useEffect } from 'react';
//import { INITIAL_DOCUMENTS } from '../../data';
import type { DocumentItem } from '../../types';
import { documentListSchema } from '../../types';
import { DocumentRow } from './DocumentRow';

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocuments() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${baseUrl}/api/documents`);

        if (!response.ok) {
          throw new Error(`Failed to load documents (${response.status})`);
        }

        const json = await response.json();
        const data = documentListSchema.parse(json);

        //console.log(data)

        setDocuments(data);


      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown error while loading documents';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadDocuments();
  }, []);



/*
  const filteredDocuments = documents.filter((doc) =>
    `${doc.title} ${doc.author}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const handleDelete = (id: number) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };
  */

   return (
    <section className="rounded-[24px] border border-[#d8e0ea] bg-white shadow-[0_16px_36px_rgba(31,41,55,0.08)]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d8e0ea] px-6 py-5">
        <div>
          <h2 className="text-[1.2rem] font-semibold text-[#1f2937]">Documents</h2>
          <p className="mt-1 text-[0.92rem] text-[#6b7280]">
            Inspect indexed documents and open available media files.
          </p>
        </div>
      </header>

      <div className="p-6">
        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-[#d8e0ea] bg-[#eef3f8] p-8 text-center text-[#6b7280]">
            Loading documents...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-8 text-center text-[#b91c1c]">
            {error}
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8e0ea] bg-[#eef3f8] p-8 text-center text-[#6b7280]">
            No documents found.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {documents.map((item) => (
              <DocumentRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
