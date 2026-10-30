/** Numbered form-style section: the label sits on the card's top border. */
export function SectionCard({ label, children, id }: { label: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="relative mt-5 rounded-2xl border border-border bg-white p-5 pt-6 sm:p-6 sm:pt-7">
      <h2 className="absolute -top-2.5 left-5 bg-background px-2 text-xs font-semibold uppercase tracking-widest text-muted">{label}</h2>
      {children}
    </section>
  );
}
