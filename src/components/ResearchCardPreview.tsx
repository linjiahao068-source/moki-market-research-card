import Link from 'next/link';
import { ResearchCard } from '@/types/research-card';

interface ResearchCardPreviewProps {
  card: ResearchCard;
}

export function ResearchCardPreview({ card }: ResearchCardPreviewProps) {
  return (
    <article className="bg-white rounded-2xl border border-[oklch(0.9_0.01_220)] shadow-[0_4px_24px_-10px_rgba(0,0,0,0.08)] p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[oklch(0.96_0.01_220)] to-[oklch(0.92_0.01_220)] flex items-center justify-center border border-[oklch(0.9_0.01_220)] shadow-inner">
            <span className="text-2xl font-bold text-[oklch(0.35_0.08_220)] tracking-tight">
              {card.ticker}
            </span>
          </div>
          <div>
            <div className="text-sm text-[oklch(0.55_0.03_220)] mb-2">
              {card.companyName}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 text-xs text-[oklch(0.55_0.03_220)] bg-[oklch(0.96_0.01_220)] px-2 py-1 rounded-full border border-[oklch(0.92_0.01_220)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.65_0.08_70)]"></span>
                Sample / Mock
              </div>
              <div className="text-xs text-[oklch(0.55_0.03_220)] bg-[oklch(0.96_0.01_220)] px-2 py-1 rounded-full border border-[oklch(0.92_0.01_220)]">
                {card.cardType}
              </div>
            </div>
          </div>
        </div>
        <div className="text-xs text-[oklch(0.55_0.03_220)] font-mono bg-[oklch(0.96_0.01_220)] px-3 py-1.5 rounded-lg border border-[oklch(0.92_0.01_220)] self-start">
          {card.updatedAt}
        </div>
      </div>

      <div className="mb-5">
        <h2 className="text-xl font-semibold text-[oklch(0.25_0.02_220)] mb-2 leading-tight">
          {card.title}
        </h2>
        <p className="text-sm text-[oklch(0.55_0.03_220)] leading-relaxed mb-4">
          {card.subtitle}
        </p>
        <div className="bg-[oklch(0.97_0.008_220)] rounded-xl p-4 border border-[oklch(0.92_0.01_220)]">
          <div className="text-xs font-semibold text-[oklch(0.35_0.08_220)] mb-2">
            一句话摘要
          </div>
          <p className="text-sm text-[oklch(0.35_0.05_220)] leading-relaxed">
            {card.summary}
          </p>
        </div>
      </div>

      <Link
        href={`/research-card/${card.slug}`}
        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[oklch(0.35_0.08_220)] text-white rounded-xl text-sm font-medium shadow-[0_4px_15px_-6px_rgba(0,0,0,0.3)] hover:bg-[oklch(0.32_0.08_220)] transition-colors"
      >
        查看研究卡
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </Link>
    </article>
  );
}
