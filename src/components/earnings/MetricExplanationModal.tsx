'use client';

interface MetricExplanationModalProps {
  open: boolean;
  onClose: () => void;
}

const explanations = [
  {
    title: '预测值',
    body: '来自第三方机构一致预期数据源，可能因数据供应商和统计口径不同而不同。',
  },
  {
    title: '公布值',
    body: '来自公司财报、SEC filing 或第三方数据源。',
  },
  {
    title: '较预期',
    body: '公布值减去预测值，并除以预测值计算百分比。',
  },
  {
    title: '同比',
    body: '与去年同期单季度相比，不等同于环比，也不等同于年初至今。',
  },
  {
    title: '财年',
    body: '财报显示的是公司财年，不一定等于自然年。',
  },
  {
    title: 'EPS',
    body: '不同来源可能使用 GAAP 或 non-GAAP EPS，需结合来源复核。',
  },
  {
    title: '公司指引',
    body: '来自公司披露、财报电话会或文本抽取。若标记为 extracted，表示仍需人工复核。',
  },
  {
    title: '非投资建议',
    body: '本模块仅用于信息整理，不构成投资建议。',
  },
];

export function MetricExplanationModal({ open, onClose }: MetricExplanationModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 px-3 pb-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="关闭指标说明"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-t-[8px] border border-border bg-white p-4 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.5)] sm:rounded-[8px] sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 text-xs font-semibold text-[var(--brand-ink)]">Metric notes</div>
            <h2 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)]">
              指标说明
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-[8px] border border-border bg-white px-3 text-sm font-semibold text-[oklch(0.22_0.018_160)] transition-colors hover:bg-muted"
          >
            关闭
          </button>
        </div>

        <div className="space-y-3">
          {explanations.map((item) => (
            <section key={item.title} className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
              <h3 className="mb-1 text-sm font-semibold text-[oklch(0.18_0.014_160)]">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-[oklch(0.45_0.018_160)]">
                {item.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
