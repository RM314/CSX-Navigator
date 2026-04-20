import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="rounded-[24px] border border-[#d8e0ea] bg-white p-8 shadow-[0_16px_36px_rgba(31,41,55,0.08)]">
      <div className="max-w-xl">
        <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[#6b7280]">
          404
        </div>

        <h1 className="mt-2 text-3xl font-semibold text-[#1f2937]">
          Page not found
        </h1>

        <p className="mt-3 text-[#6b7280]">
          The requested page does not exist or the link is outdated.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            to="/chat"
            className="inline-flex items-center justify-center rounded-xl bg-[#2f6fed] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Go to chat
          </Link>

          <Link
            to="/documents"
            className="inline-flex items-center justify-center rounded-xl bg-[#eef3f8] px-4 py-2.5 text-sm font-semibold text-[#1f2937]"
          >
            Open documents
          </Link>
        </div>
      </div>
    </section>
  );
}