interface DisclaimerBoxProps {
  text: string;
}

export function DisclaimerBox({ text }: DisclaimerBoxProps) {
  return (
    <div className="mb-8 rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-[oklch(0.93_0.08_35)] text-xs font-bold text-[var(--risk-ink)]">
          !
        </span>
        <h3 className="text-sm font-semibold text-[var(--risk-ink)]">
          8. 免责声明
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-[oklch(0.4_0.055_30)]">
        {text}
      </p>
    </div>
  );
}
