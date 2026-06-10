import { Evidence } from '@/types/research-card';

interface EvidenceItemProps {
  evidence: Evidence;
}

export function EvidenceItem({ evidence }: EvidenceItemProps) {
  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      {/* 时间线 */}
      <div className="absolute left-2 top-1 bottom-0 w-px bg-gradient-to-b from-[oklch(0.35_0.08_220)] via-[oklch(0.7_0.04_220)] to-transparent"></div>
      <div className="absolute left-0 top-0 w-5 h-5 rounded-full bg-white border-2 border-[oklch(0.35_0.08_220)] flex items-center justify-center">
        <span className="w-2 h-2 rounded-full bg-[oklch(0.35_0.08_220)]"></span>
      </div>

      {/* 内容卡片 */}
      <div className="bg-[oklch(0.99_0.005_220)] rounded-xl p-4 border border-[oklch(0.92_0.01_220)] shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[oklch(0.35_0.08_220)] text-sm">
              {evidence.sourceLabel}
            </span>
            <span className="text-[10px] text-[oklch(0.55_0.03_220)] bg-[oklch(0.96_0.01_220)] px-2 py-0.5 rounded-full border border-[oklch(0.92_0.01_220)] font-mono">
              {evidence.sourceType}
            </span>
          </div>
          <span className="text-xs text-[oklch(0.65_0.03_220)] font-mono">
            {evidence.timestamp}
          </span>
          <span className="ml-auto flex items-center gap-1">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i < Math.round(evidence.confidence * 5)
                      ? 'bg-[oklch(0.35_0.08_220)]'
                      : 'bg-[oklch(0.92_0.01_220)]'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-[oklch(0.55_0.03_220)] font-mono">
              {(evidence.confidence * 100).toFixed(0)}%
            </span>
          </span>
        </div>
        <div className="text-[oklch(0.25_0.02_220)] text-sm leading-relaxed font-[450]">
          {evidence.summary}
        </div>
      </div>
    </div>
  );
}
