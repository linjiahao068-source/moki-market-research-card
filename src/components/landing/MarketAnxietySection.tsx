import { Activity, GitBranch, Newspaper } from 'lucide-react';

const anxieties = [
  {
    icon: Activity,
    symbol: 'NVDA',
    question: 'AI 算力需求到底是在加速，还是市场已经提前透支？',
    signal: 'Moki 会把云厂商 capex、GPU 交付、数据中心收入和毛利率放在同一张卡里复盘。',
  },
  {
    icon: Newspaper,
    symbol: 'TSLA',
    question: '一条 FSD / Robotaxi 新闻，到底改变了什么？',
    signal: 'Moki 会区分新闻事实、KOL 解读、交付数据、汽车毛利率和储能线索。',
  },
  {
    icon: GitBranch,
    symbol: 'ORCL',
    question: 'AI 云叙事能不能转成可见收入？',
    signal: 'Moki 会把 RPO、OCI、capex、数据中心交付和现金流压力拆成观察指标。',
  },
];

export function MarketAnxietySection() {
  return (
    <section className="px-4 py-8 sm:px-6" id="anxiety">
      <div className="mx-auto w-full max-w-6xl rounded-[8px] border border-border bg-white p-5 shadow-[0_12px_40px_-32px_rgba(0,0,0,0.28)] sm:p-6">
        <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">Today’s market anxiety</div>
            <h2 className="text-2xl font-bold leading-tight text-[oklch(0.16_0.014_160)] sm:text-3xl">
              今日市场焦虑，不直接给结论，先拆成研究卡。
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[oklch(0.45_0.018_160)]">
              Moki Market 的特色不是预测，而是把热门 symbol 的焦虑拆成：叙事、指标、风险、证据缺口和下一步复盘。
            </p>
          </div>
          <span className="w-fit rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-ink)]">
            研究桌视图
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {anxieties.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.symbol} className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--brand-ink)]">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    焦虑样本
                  </div>
                  <span className="rounded-full border border-border bg-white px-2.5 py-1 font-mono text-xs text-[oklch(0.45_0.018_160)]">
                    {item.symbol}
                  </span>
                </div>
                <h3 className="mb-3 text-base font-semibold leading-snug text-[oklch(0.18_0.014_160)]">
                  {item.question}
                </h3>
                <p className="border-l-2 border-[var(--brand-dot)] pl-3 text-sm leading-relaxed text-[oklch(0.43_0.018_160)]">
                  {item.signal}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
