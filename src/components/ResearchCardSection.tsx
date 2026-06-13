interface ResearchCardSectionProps {
  title: string;
  children: React.ReactNode;
  id?: string;
  variant?: 'default' | 'elevated' | 'subtle';
}

export function ResearchCardSection({ title, children, id, variant = 'default' }: ResearchCardSectionProps) {
  const sectionNumber = title.match(/^\d+/)?.[0];
  const sectionTitle = title.replace(/^\d+\.\s*/, '');
  const baseStyles = "mb-4 rounded-[8px] border p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5";
  const variants = {
    default: "border-border bg-white",
    elevated: "border-[oklch(0.87_0.016_85)] bg-white shadow-[0_8px_28px_-24px_rgba(0,0,0,0.24)]",
    subtle: "border-border bg-[oklch(0.992_0.005_85)]",
  };

  return (
    <section id={id} className="scroll-mt-8">
      <div className={`${baseStyles} ${variants[variant]}`}>
        <h3 className="mb-4 flex min-w-0 items-center gap-3 text-sm font-semibold text-[oklch(0.2_0.02_160)]">
          {sectionNumber && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] border border-[var(--brand-border)] bg-[var(--brand-soft-strong)] text-xs font-bold text-[var(--brand-ink)]">
            {sectionNumber}
          </span>
          )}
          <span className="min-w-0 flex-1 leading-snug">{sectionTitle}</span>
        </h3>
        <div className="text-[oklch(0.18_0.014_160)]">{children}</div>
      </div>
    </section>
  );
}
