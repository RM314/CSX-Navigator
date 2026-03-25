type PlaceholderPageProps = {
  title: string;
  text: string;
};

export function PlaceholderPage({ title, text }: PlaceholderPageProps) {
  return (
    <section className="rounded-[24px] border border-[#d8e0ea] bg-white p-8 shadow-[0_16px_36px_rgba(31,41,55,0.08)]">
      <h2 className="text-[1.2rem] font-semibold text-[#1f2937]">{title}</h2>
      <p className="mt-2 text-[#6b7280]">{text}</p>
    </section>
  );
}
