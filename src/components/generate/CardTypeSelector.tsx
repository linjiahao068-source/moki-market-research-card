import { cardTypeOptions, GenerateCardType } from '@/lib/generateResearchCard/mockGenerateResearchCard';

interface CardTypeSelectorProps {
  value: GenerateCardType;
  onChange: (value: GenerateCardType) => void;
}

export function CardTypeSelector({ value, onChange }: CardTypeSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cardTypeOptions.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-[8px] border p-4 text-left transition-colors ${
              selected
                ? 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                : 'border-border bg-white text-[oklch(0.22_0.018_160)] hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)]'
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${selected ? 'bg-[var(--brand-dot)]' : 'bg-border'}`} />
              <span className="text-sm font-semibold">{option.label}</span>
            </div>
            <p className="text-xs leading-relaxed text-[oklch(0.45_0.018_160)]">
              {option.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
