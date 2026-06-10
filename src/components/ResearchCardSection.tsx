interface ResearchCardSectionProps {
  title: string;
  children: React.ReactNode;
  id?: string;
  variant?: 'default' | 'elevated' | 'subtle';
}

export function ResearchCardSection({ title, children, id, variant = 'default' }: ResearchCardSectionProps) {
  const baseStyles = "p-6 mb-5";
  const variants = {
    default: "bg-white rounded-2xl border border-[oklch(0.9_0.01_220)] shadow-sm",
    elevated: "bg-white rounded-2xl border border-[oklch(0.9_0.01_220)] shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)]",
    subtle: "bg-[oklch(0.99_0.005_220)] rounded-2xl border border-[oklch(0.92_0.01_220)]",
  };

  return (
    <section id={id} className="scroll-mt-10">
      <div className={`${baseStyles} ${variants[variant]}`}>
        <h3 className="text-sm font-semibold text-[oklch(0.35_0.08_220)] mb-5 flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg bg-[oklch(0.96_0.01_220)] flex items-center justify-center text-xs font-bold text-[oklch(0.35_0.08_220)] border border-[oklch(0.92_0.01_220)]">
            {title.split('.')[0]}
          </span>
          <span className="tracking-wide">{title}</span>
          <span className="flex-1 h-px bg-gradient-to-r from-[oklch(0.92_0.01_220)] to-transparent ml-3"></span>
        </h3>
        <div className="text-[oklch(0.25_0.02_220)]">{children}</div>
      </div>
    </section>
  );
}
