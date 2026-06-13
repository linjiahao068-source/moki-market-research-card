const painPoints = [
  {
    title: '信息太碎',
    text: '公告、英文新闻、财报电话会、KOL 截图和短视频观点散落在不同平台，很难拼成一条完整研究线索。',
  },
  {
    title: '财报太长',
    text: '收入、毛利率、capex、指引和管理层措辞都重要，但中文用户通常没有时间逐页拆解。',
  },
  {
    title: 'X 舆情太吵',
    text: '同一只股票的乐观叙事和谨慎叙事同时扩散，热度很高，但证据强弱并不一样。',
  },
  {
    title: 'AI 产业链变化太快',
    text: '芯片、云厂商、模型、应用和电力数据中心互相传导，需要看清公司在链条里的位置。',
  },
];

export function PainPointSection() {
  return (
    <section className="px-4 py-8 sm:px-6" id="pain-points">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-5 max-w-3xl">
          <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">Research pain points</div>
          <h2 className="text-2xl font-bold leading-tight text-[oklch(0.16_0.014_160)] sm:text-3xl">
            美股信息不是少，而是太碎、太吵、太难复盘。
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[oklch(0.45_0.018_160)]">
            Moki 的首页不追求制造兴奋感，而是先把研究者真正卡住的地方摆出来。
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {painPoints.map((item, index) => (
            <article key={item.title} className="rounded-[8px] border border-border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="mb-3 font-mono text-xs font-semibold text-[var(--brand-ink)]">
                0{index + 1}
              </div>
              <h3 className="mb-2 text-base font-semibold text-[oklch(0.18_0.014_160)]">{item.title}</h3>
              <p className="text-sm leading-relaxed text-[oklch(0.45_0.018_160)]">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
