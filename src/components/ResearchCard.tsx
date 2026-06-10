'use client';

import { ResearchCard as ResearchCardType } from '@/types/research-card';
import { ResearchCardSection } from './ResearchCardSection';
import { EvidenceItem } from './EvidenceItem';
import { DisclaimerBox } from './DisclaimerBox';

interface ResearchCardProps {
  card: ResearchCardType;
}

const sections = [
  { id: 'summary', title: '1. 一句话摘要' },
  { id: 'sentiment', title: '2. X 舆情面' },
  { id: 'fundamentals', title: '3. 基本面' },
  { id: 'events', title: '4. 政策/事件' },
  { id: 'technical', title: '5. 技术/交易面' },
  { id: 'evidence', title: '6. 证据链' },
  { id: 'nextsteps', title: '7. 下一步研究' },
  { id: 'disclaimer', title: '8. 免责声明' },
];

export function ResearchCard({ card }: ResearchCardProps) {
  return (
    <div className="min-h-screen bg-[oklch(0.975_0.008_220)]">
      <div className="max-w-[1150px] mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* 主内容区 - 适合截图 */}
          <div className="flex-1 min-w-0">
            {/* 页面头部 */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-[oklch(0.35_0.08_220)] mb-3">
                <div className="w-9 h-9 rounded-xl bg-[oklch(0.35_0.08_220)] flex items-center justify-center shadow-[0_4px_15px_-6px_rgba(0,0,0,0.3)]">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <h1 className="text-lg font-semibold tracking-tight">Moki Market</h1>
              </div>
              <h2 className="text-base text-[oklch(0.55_0.03_220)] mb-3 tracking-wide">
                Research Card
              </h2>
              <div className="inline-flex items-center gap-2 bg-[oklch(0.96_0.01_220)] text-[oklch(0.55_0.03_220)] px-4 py-1.5 rounded-full text-xs border border-[oklch(0.9_0.01_220)] shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.65_0.08_70)] animate-pulse"></span>
                Sample / Mock
              </div>
            </div>

            {/* 卡片头部 - 增强质感 */}
            <div className="bg-white rounded-2xl border border-[oklch(0.9_0.01_220)] shadow-[0_4px_24px_-10px_rgba(0,0,0,0.08)] p-7 mb-6 relative">
              {/* 装饰线 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[oklch(0.35_0.08_220)] via-[oklch(0.5_0.06_220)] to-[oklch(0.35_0.08_220)] rounded-t-2xl opacity-60"></div>

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[oklch(0.96_0.01_220)] to-[oklch(0.92_0.01_220)] flex items-center justify-center border border-[oklch(0.9_0.01_220)] shadow-inner">
                    <span className="text-2xl font-bold text-[oklch(0.35_0.08_220)] tracking-tight">
                      {card.ticker}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-[oklch(0.55_0.03_220)] mb-0.5">
                      {card.companyName}
                    </div>
                    <div className="text-xs text-[oklch(0.65_0.03_220)] font-mono bg-[oklch(0.96_0.01_220)] px-2 py-0.5 rounded-md inline-block border border-[oklch(0.92_0.01_220)]">
                      {card.cardType}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-xs text-[oklch(0.55_0.03_220)]">更新时间</div>
                  <div className="text-sm text-[oklch(0.35_0.08_220)] font-mono font-medium bg-[oklch(0.96_0.01_220)] px-3 py-1.5 rounded-lg border border-[oklch(0.92_0.01_220)]">
                    {card.updatedAt}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-dashed border-[oklch(0.92_0.01_220)]">
                <h2 className="text-xl font-semibold text-[oklch(0.25_0.02_220)] mb-2 leading-tight tracking-tight">
                  {card.title}
                </h2>
                <p className="text-[oklch(0.55_0.03_220)] leading-relaxed text-[15px]">
                  {card.subtitle}
                </p>
              </div>
            </div>

            {/* 1. 一句话摘要 */}
            <ResearchCardSection id="summary" title="1. 一句话摘要" variant="elevated">
              <div className="bg-gradient-to-r from-[oklch(0.96_0.01_220)] to-[oklch(0.94_0.01_220)] rounded-xl p-5 border-l-4 border-[oklch(0.35_0.08_220)]">
                <p className="text-[oklch(0.25_0.02_220)] leading-relaxed text-[15px]">
                  {card.summary}
                </p>
              </div>
            </ResearchCardSection>

            {/* 2. X 舆情面 */}
            <ResearchCardSection id="sentiment" title="2. X 舆情面">
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-r from-[oklch(0.96_0.01_220)] to-[oklch(0.94_0.01_220)] rounded-xl border border-[oklch(0.92_0.01_220)]">
                  <div className="text-center p-3">
                    <div className="text-[11px] text-[oklch(0.55_0.03_220)] mb-1 uppercase tracking-wider">热度</div>
                    <div className="text-2xl font-bold text-[oklch(0.35_0.08_220)] tracking-tight">
                      {card.sentiment.heatLevel}<span className="text-sm text-[oklch(0.55_0.03_220)] font-normal">/10</span>
                    </div>
                  </div>
                  <div className="text-center p-3 border-x border-[oklch(0.92_0.01_220)]">
                    <div className="text-[11px] text-[oklch(0.55_0.03_220)] mb-1 uppercase tracking-wider">方向</div>
                    <div className="text-sm font-medium text-[oklch(0.25_0.02_220)]">
                      {card.sentiment.direction}
                    </div>
                  </div>
                  <div className="text-center p-3">
                    <div className="text-[11px] text-[oklch(0.55_0.03_220)] mb-1 uppercase tracking-wider">分歧</div>
                    <div className="text-2xl font-bold text-[oklch(0.35_0.08_220)] tracking-tight">
                      {(card.sentiment.disagreement * 100).toFixed(0)}<span className="text-sm text-[oklch(0.55_0.03_220)] font-normal">%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[oklch(0.55_0.03_220)] mb-3 font-semibold tracking-wide flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[oklch(0.35_0.08_220)]"></span>
                    关键讨论
                  </div>
                  <div className="space-y-2.5">
                    {card.sentiment.keyDebates.map((debate, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-[oklch(0.9_0.01_220)] shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-[oklch(0.35_0.08_220)] mt-2 flex-shrink-0"></span>
                        <span className="text-sm text-[oklch(0.25_0.02_220)] leading-relaxed">{debate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ResearchCardSection>

            {/* 3. 基本面 */}
            <ResearchCardSection id="fundamentals" title="3. 基本面">
              <div className="space-y-6">
                <div>
                  <div className="text-xs text-[oklch(0.55_0.03_220)] mb-2 font-semibold tracking-wide flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[oklch(0.35_0.08_220)]"></span>
                    商业模式
                  </div>
                  <div className="p-4 bg-[oklch(0.99_0.005_220)] rounded-xl border border-[oklch(0.92_0.01_220)]">
                    <p className="text-sm text-[oklch(0.25_0.02_220)] leading-relaxed">
                      {card.fundamentals.businessModel}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[oklch(0.55_0.03_220)] mb-3 font-semibold tracking-wide flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[oklch(0.35_0.08_220)]"></span>
                    收入驱动
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {card.fundamentals.revenueDrivers.map((driver, idx) => (
                      <span key={idx} className="px-4 py-2 bg-white text-[oklch(0.25_0.02_220)] text-sm rounded-xl border border-[oklch(0.9_0.01_220)] shadow-sm font-medium">
                        {driver}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[oklch(0.55_0.03_220)] mb-3 font-semibold tracking-wide flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[oklch(0.35_0.08_220)]"></span>
                    关键指标
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {card.fundamentals.keyMetrics.map((metric, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-5 border border-[oklch(0.9_0.01_220)] shadow-sm">
                        <div className="text-[11px] text-[oklch(0.55_0.03_220)] mb-1.5 uppercase tracking-wider">{metric.label}</div>
                        <div className="text-xl font-bold text-[oklch(0.35_0.08_220)] tracking-tight">{metric.value}</div>
                        {metric.note && <div className="text-xs text-[oklch(0.65_0.03_220)] mt-2">{metric.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[oklch(0.55_0.03_220)] mb-3 font-semibold tracking-wide flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[oklch(0.65_0.08_70)]"></span>
                    风险提醒
                  </div>
                  <div className="space-y-2.5">
                    {card.fundamentals.risks.map((risk, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-[oklch(0.99_0.005_220)] rounded-xl border border-[oklch(0.65_0.08_70)/0.15]">
                        <span className="w-2 h-2 rounded-full bg-[oklch(0.65_0.08_70)] mt-2 flex-shrink-0"></span>
                        <span className="text-sm text-[oklch(0.25_0.02_220)] leading-relaxed">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ResearchCardSection>

            {/* 4. 政策/事件 */}
            <ResearchCardSection id="events" title="4. 政策/事件">
              <div className="space-y-5">
                {card.events.product.length > 0 && (
                  <div>
                    <div className="text-xs text-[oklch(0.55_0.03_220)] mb-3 font-semibold tracking-wide flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[oklch(0.35_0.08_220)]"></span>
                      产品动态
                    </div>
                    <div className="space-y-2.5">
                      {card.events.product.map((event, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-[oklch(0.9_0.01_220)] shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-[oklch(0.35_0.08_220)] mt-2 flex-shrink-0"></span>
                          <span className="text-sm text-[oklch(0.25_0.02_220)] leading-relaxed">{event}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {card.events.macro.length > 0 && (
                  <div>
                    <div className="text-xs text-[oklch(0.55_0.03_220)] mb-3 font-semibold tracking-wide flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[oklch(0.35_0.08_220)]"></span>
                      宏观观察
                    </div>
                    <div className="space-y-2.5">
                      {card.events.macro.map((event, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-[oklch(0.9_0.01_220)] shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-[oklch(0.35_0.08_220)] mt-2 flex-shrink-0"></span>
                          <span className="text-sm text-[oklch(0.25_0.02_220)] leading-relaxed">{event}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-[oklch(0.55_0.03_220)] mb-3 font-semibold tracking-wide flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[oklch(0.35_0.08_220)]"></span>
                    财报日历
                  </div>
                  <div className="space-y-2.5">
                    {card.events.earningsCalendar.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-gradient-to-r from-[oklch(0.96_0.01_220)] to-[oklch(0.94_0.01_220)] rounded-xl border border-[oklch(0.92_0.01_220)]">
                        <span className="text-sm font-mono text-[oklch(0.35_0.08_220)] w-32 font-semibold">
                          {item.date}
                        </span>
                        <span className="text-sm text-[oklch(0.25_0.02_220)]">{item.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ResearchCardSection>

            {/* 5. 技术/交易面 */}
            <ResearchCardSection id="technical" title="5. 技术/交易面">
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="bg-white rounded-xl p-5 border border-[oklch(0.9_0.01_220)] shadow-sm">
                    <div className="text-[11px] text-[oklch(0.55_0.03_220)] mb-2 uppercase tracking-wider">价格走势</div>
                    <div className="text-sm text-[oklch(0.25_0.02_220)] leading-relaxed">{card.technicalContext.priceAction}</div>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-[oklch(0.9_0.01_220)] shadow-sm">
                    <div className="text-[11px] text-[oklch(0.55_0.03_220)] mb-2 uppercase tracking-wider">成交量</div>
                    <div className="text-sm text-[oklch(0.25_0.02_220)] leading-relaxed">{card.technicalContext.volume}</div>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-[oklch(0.9_0.01_220)] shadow-sm">
                    <div className="text-[11px] text-[oklch(0.55_0.03_220)] mb-2 uppercase tracking-wider">期权 IV</div>
                    <div className="text-sm text-[oklch(0.25_0.02_220)] leading-relaxed">{card.technicalContext.optionsIv}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[oklch(0.55_0.03_220)] mb-3 font-semibold tracking-wide flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[oklch(0.35_0.08_220)]"></span>
                    关键区间
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {card.technicalContext.keyZones.map((zone, idx) => (
                      <div key={idx} className="px-4 py-2.5 bg-white rounded-xl border border-[oklch(0.9_0.01_220)] shadow-sm">
                        <span className="text-xs text-[oklch(0.55_0.03_220)]">{zone.type}：</span>
                        <span className="text-sm font-semibold text-[oklch(0.35_0.08_220)]">{zone.level}</span>
                        {zone.note && <span className="text-xs text-[oklch(0.65_0.03_220)] ml-1">({zone.note})</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-r from-[oklch(0.96_0.01_220)] to-[oklch(0.94_0.01_220)] rounded-xl border border-[oklch(0.92_0.01_220)]">
                  <p className="text-sm text-[oklch(0.55_0.03_220)] leading-relaxed">
                    {card.technicalContext.note}
                  </p>
                </div>
              </div>
            </ResearchCardSection>

            {/* 6. 证据链 - 专业研究记录风格 */}
            <ResearchCardSection id="evidence" title="6. 证据链" variant="subtle">
              <div className="pt-2">
                {card.evidence.map((ev) => (
                  <EvidenceItem key={ev.id} evidence={ev} />
                ))}
              </div>
            </ResearchCardSection>

            {/* 7. 下一步研究 */}
            <ResearchCardSection id="nextsteps" title="7. 下一步研究">
              <div className="space-y-4">
                {card.nextSteps.map((step, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-5 border border-[oklch(0.9_0.01_220)] shadow-sm">
                    <div className="flex items-start justify-between mb-2.5 gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-[oklch(0.35_0.08_220)] text-white flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <p className="font-semibold text-[oklch(0.25_0.02_220)] text-sm leading-relaxed">
                          {step.task}
                        </p>
                      </div>
                      <span className="text-xs text-[oklch(0.55_0.03_220)] font-mono bg-[oklch(0.96_0.01_220)] px-3 py-1 rounded-lg border border-[oklch(0.92_0.01_220)] whitespace-nowrap">
                        {step.followUpDate}
                      </span>
                    </div>
                    <p className="text-sm text-[oklch(0.55_0.03_220)] leading-relaxed pl-9">
                      {step.whyItMatters}
                    </p>
                  </div>
                ))}
              </div>
            </ResearchCardSection>

            {/* 8. 免责声明 */}
            <section id="disclaimer">
              <DisclaimerBox text={card.disclaimer} />
            </section>

            {/* 页脚 - 适合截图 */}
            <div className="text-center text-xs text-[oklch(0.65_0.03_220)] pb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-lg bg-[oklch(0.35_0.08_220)] flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-[10px]">M</span>
                </div>
                <span className="font-medium text-[oklch(0.55_0.03_220)]">Moki Market</span>
              </div>
              <span className="font-mono">Research Card · {card.updatedAt}</span>
            </div>
          </div>

          {/* 右侧导航 - 桌面端 */}
          <div className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-10">
              <div className="bg-white rounded-2xl border border-[oklch(0.9_0.01_220)] shadow-[0_4px_24px_-10px_rgba(0,0,0,0.08)] p-5">
                <div className="text-xs font-bold text-[oklch(0.35_0.08_220)] mb-4 px-2 tracking-wide">
                  研究卡结构
                </div>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="block px-3 py-2 text-sm text-[oklch(0.55_0.03_220)] hover:text-[oklch(0.35_0.08_220)] hover:bg-[oklch(0.96_0.01_220)] rounded-lg transition-all hover:pl-4"
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
