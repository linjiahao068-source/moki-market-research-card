'use client';

import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  FileText,
  Search,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { ResearchCard as ResearchCardType } from '@/types/research-card';
import type { ResearchReport } from '@/types/research-report';
import { EvidenceReferencePanel } from './research-report/EvidenceReferencePanel';
import { ResearchCardSection } from './ResearchCardSection';
import { EvidenceItem } from './EvidenceItem';
import { DisclaimerBox } from './DisclaimerBox';

interface ResearchCardProps {
  card: ResearchCardType;
  report?: ResearchReport;
}

const sections = [
  { id: 'summary', title: '1. Executive Summary' },
  { id: 'sentiment', title: '2. Market Narrative' },
  { id: 'fundamentals', title: '3. Business Fundamentals' },
  { id: 'events', title: '4. Catalysts & Events' },
  { id: 'technical', title: '5. Technical Context' },
  { id: 'evidence', title: '6. 证据链' },
  { id: 'nextsteps', title: '7. 下一步研究' },
  { id: 'disclaimer', title: '8. 免责声明' },
];

export function ResearchCard({ card, report }: ResearchCardProps) {
  const topMetrics = card.fundamentals.keyMetrics.slice(0, 3);
  const topRisks = card.fundamentals.risks.slice(0, 3);
  const topSteps = card.nextSteps.slice(0, 3);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1180px] px-3 py-4 sm:px-6 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_230px]">
          <div className="min-w-0">
            <div className="mb-4">
              <Link
                href="/"
                className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-transparent px-3 text-sm font-medium text-[oklch(0.42_0.018_160)] transition-colors hover:border-border hover:bg-white hover:text-[oklch(0.2_0.018_160)]"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                返回首页
              </Link>
            </div>

            <section className="mb-4 overflow-hidden rounded-[8px] border border-border bg-white shadow-[0_16px_46px_-34px_rgba(0,0,0,0.36)]">
              <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--brand)]">
                    <span className="text-xs font-bold text-[oklch(0.14_0.015_160)]">M</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[oklch(0.18_0.014_160)]">
                      Moki Market Research Card
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-medium text-[var(--brand-ink)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-dot)]"></span>
                    {card.isMock ? 'Fallback View' : 'Executive View'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-xs text-[oklch(0.47_0.018_160)]">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {card.updatedAt}
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="mb-5 flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft-strong)] sm:h-[72px] sm:w-[72px]">
                      <span className="text-2xl font-bold tracking-tight text-[var(--brand-ink)] sm:text-3xl">
                        {card.ticker}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1 text-sm text-[oklch(0.48_0.018_160)]">
                        {card.companyName}
                      </div>
                      <h1 className="mb-2 text-2xl font-bold leading-tight text-[oklch(0.16_0.014_160)] sm:text-3xl">
                        {card.title}
                      </h1>
                      <p className="max-w-3xl text-sm leading-relaxed text-[oklch(0.43_0.018_160)] sm:text-base">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>

                </div>

                <div className="mb-5 border-l-2 border-[var(--brand-dot)] pl-3 sm:pl-4">
                  <div className="mb-1 text-xs font-semibold text-[var(--brand-ink)]">
                    一句话摘要
                  </div>
                  <p className="text-sm leading-relaxed text-[oklch(0.2_0.016_160)] sm:text-base">
                    {card.summary.oneLine}
                  </p>
                </div>

                <div className="grid gap-4 border-t border-border pt-5 md:grid-cols-3">
                  <div className="min-w-0">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--brand-ink)]">
                      <TrendingUp className="h-4 w-4" aria-hidden="true" />
                      核心观察
                    </div>
                    <div className="divide-y divide-border rounded-[8px] border border-border">
                      {topMetrics.map((metric, idx) => (
                        <div key={idx} className="p-3">
                          <div className="mb-1 text-[11px] text-[oklch(0.5_0.018_160)]">
                            {metric.label}
                          </div>
                          <div className="text-sm font-semibold leading-snug text-[oklch(0.18_0.014_160)]">
                            {metric.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--risk-ink)]">
                      <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                      风险提醒
                    </div>
                    <div className="space-y-2">
                      {topRisks.map((risk, idx) => (
                        <div key={idx} className="rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-3 text-sm leading-relaxed text-[var(--risk-ink)]">
                          {risk}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--brand-ink)]">
                      <Search className="h-4 w-4" aria-hidden="true" />
                      下一步研究
                    </div>
                    <div className="space-y-2">
                      {topSteps.map((step, idx) => (
                        <div key={idx} className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
                          <div className="text-sm font-semibold leading-snug text-[oklch(0.18_0.014_160)]">
                            {step.task}
                          </div>
                          {step.followUpDate && (
                            <div className="mt-1 font-mono text-xs text-[oklch(0.5_0.018_160)]">
                              {step.followUpDate}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="mt-5 border-t border-border pt-4 text-center text-[11px] leading-relaxed text-[oklch(0.52_0.018_160)]">
                  {card.disclaimer}
                </p>
              </div>
            </section>

            <ResearchCardSection id="summary" title="1. Executive Summary" variant="elevated">
              <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4">
                <p className="text-sm leading-relaxed text-[oklch(0.2_0.018_160)] sm:text-base">
                  {card.summary.oneLine}
                </p>
              </div>
            </ResearchCardSection>

            <ResearchCardSection id="sentiment" title="2. Market Narrative">
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-4">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-[oklch(0.48_0.018_160)]">
                      <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                      关注度
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-[var(--brand-ink)]">
                      {card.sentiment.heatLevel}
                      <span className="text-sm font-medium text-[oklch(0.5_0.018_160)]">/10</span>
                    </div>
                  </div>
                  <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-4">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-[oklch(0.48_0.018_160)]">
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                      方向
                    </div>
                    <div className="text-sm font-semibold leading-snug text-[oklch(0.18_0.014_160)]">
                      {card.sentiment.direction}
                    </div>
                  </div>
                  <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-4">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-[oklch(0.48_0.018_160)]">
                      <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                      分歧
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-[var(--brand-ink)]">
                      {(card.sentiment.disagreement * 100).toFixed(0)}
                      <span className="text-sm font-medium text-[oklch(0.5_0.018_160)]">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-xs font-semibold text-[oklch(0.45_0.018_160)]">
                    关键讨论
                  </div>
                  <div className="space-y-2">
                    {card.sentiment.keyDebates.map((debate, idx) => (
                      <div key={idx} className="flex gap-3 rounded-[8px] border border-border bg-white p-3 text-sm leading-relaxed text-[oklch(0.2_0.016_160)]">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-dot)]"></span>
                        <span className="min-w-0">{debate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ResearchCardSection>

            <ResearchCardSection id="fundamentals" title="3. 基本面">
              <div className="space-y-5">
                <div>
                  <div className="mb-2 text-xs font-semibold text-[oklch(0.45_0.018_160)]">
                    商业模式
                  </div>
                  <p className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-4 text-sm leading-relaxed text-[oklch(0.2_0.016_160)]">
                    {card.fundamentals.businessModel}
                  </p>
                </div>

                <div>
                  <div className="mb-3 text-xs font-semibold text-[oklch(0.45_0.018_160)]">
                    收入驱动
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {card.fundamentals.revenueDrivers.map((driver, idx) => (
                      <span key={idx} className="rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-[oklch(0.2_0.016_160)]">
                        {driver}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-xs font-semibold text-[oklch(0.45_0.018_160)]">
                    关键指标
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {card.fundamentals.keyMetrics.map((metric, idx) => (
                      <div key={idx} className="rounded-[8px] border border-border bg-white p-4">
                        <div className="mb-1 text-[11px] text-[oklch(0.5_0.018_160)]">
                          {metric.label}
                        </div>
                        <div className="text-base font-semibold leading-snug text-[var(--brand-ink)]">
                          {metric.description}
                        </div>
                        <div className="mt-2 text-xs leading-relaxed text-[oklch(0.48_0.018_160)]">
                          {metric.whyItMatters}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-xs font-semibold text-[var(--risk-ink)]">
                    风险提醒
                  </div>
                  <div className="space-y-2">
                    {card.fundamentals.risks.map((risk, idx) => (
                      <div key={idx} className="flex gap-3 rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-3 text-sm leading-relaxed text-[var(--risk-ink)]">
                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="min-w-0">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ResearchCardSection>

            <ResearchCardSection id="events" title="4. 政策/事件">
              <div className="space-y-3">
                {card.events.items.map((event, idx) => (
                  <div key={idx} className="rounded-[8px] border border-border bg-white p-4">
                    <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[10px] text-[oklch(0.47_0.018_160)]">
                        {event.type}
                      </span>
                      <span className="min-w-0 text-sm font-semibold text-[oklch(0.18_0.014_160)]">
                        {event.title}
                      </span>
                    </div>
                    <p className="mb-3 text-sm leading-relaxed text-[oklch(0.42_0.018_160)]">
                      {event.description}
                    </p>
                    <p className="rounded-[8px] border-l-2 border-[var(--brand-dot)] bg-[var(--brand-soft)] p-3 text-xs leading-relaxed text-[var(--brand-ink)]">
                      待核查问题：{event.impactQuestion}
                    </p>
                  </div>
                ))}
              </div>
            </ResearchCardSection>

            <ResearchCardSection id="technical" title="5. 技术/交易面">
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-[8px] border border-border bg-white p-4">
                    <div className="mb-2 text-[11px] font-semibold text-[oklch(0.5_0.018_160)]">价格走势</div>
                    <div className="text-sm leading-relaxed text-[oklch(0.2_0.016_160)]">{card.technicalContext.priceAction}</div>
                  </div>
                  <div className="rounded-[8px] border border-border bg-white p-4">
                    <div className="mb-2 text-[11px] font-semibold text-[oklch(0.5_0.018_160)]">成交量</div>
                    <div className="text-sm leading-relaxed text-[oklch(0.2_0.016_160)]">{card.technicalContext.volume}</div>
                  </div>
                  <div className="rounded-[8px] border border-border bg-white p-4">
                    <div className="mb-2 text-[11px] font-semibold text-[oklch(0.5_0.018_160)]">期权 IV</div>
                    <div className="text-sm leading-relaxed text-[oklch(0.2_0.016_160)]">{card.technicalContext.optionsIv}</div>
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-xs font-semibold text-[oklch(0.45_0.018_160)]">
                    关键区间
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {card.technicalContext.keyZones.map((zone, idx) => (
                      <div key={idx} className="rounded-[8px] border border-border bg-white px-3 py-2">
                        <span className="text-xs text-[oklch(0.48_0.018_160)]">{zone.type}：</span>
                        <span className="text-sm font-semibold text-[var(--brand-ink)]">{zone.level}</span>
                        {zone.note && <span className="ml-1 text-xs text-[oklch(0.48_0.018_160)]">({zone.note})</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-4 text-sm leading-relaxed text-[oklch(0.42_0.018_160)]">
                  {card.technicalContext.note}
                </p>
              </div>
            </ResearchCardSection>

            <ResearchCardSection id="evidence" title="6. 证据链" variant="subtle">
              <div className="pt-1">
                {report ? (
                  <EvidenceReferencePanel report={report} />
                ) : (
                  card.evidence.map((ev) => (
                    <EvidenceItem key={ev.id} evidence={ev} />
                  ))
                )}
              </div>
            </ResearchCardSection>

            <ResearchCardSection id="nextsteps" title="7. 下一步研究">
              <div className="space-y-3">
                {card.nextSteps.map((step, idx) => (
                  <div key={idx} className="rounded-[8px] border border-border bg-white p-4">
                    <div className="mb-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-[var(--brand)] text-xs font-bold text-[oklch(0.14_0.015_160)]">
                          {idx + 1}
                        </span>
                        <p className="min-w-0 text-sm font-semibold leading-relaxed text-[oklch(0.18_0.014_160)]">
                          {step.task}
                        </p>
                      </div>
                      {step.followUpDate && (
                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-xs text-[oklch(0.47_0.018_160)]">
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          {step.followUpDate}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-[oklch(0.45_0.018_160)] sm:pl-9">
                      {step.whyItMatters}
                    </p>
                  </div>
                ))}
              </div>
            </ResearchCardSection>

            <section id="disclaimer">
              <DisclaimerBox text={card.disclaimer} />
            </section>

            <footer className="pb-6 text-center text-xs text-[oklch(0.5_0.018_160)]">
              <div className="mb-2 flex items-center justify-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-[var(--brand)]">
                  <span className="text-[10px] font-bold text-[oklch(0.14_0.015_160)]">M</span>
                </div>
                <span className="font-semibold text-[oklch(0.25_0.035_155)]">Moki Market</span>
              </div>
              <span className="font-mono">Research Card · {card.updatedAt}</span>
            </footer>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-6 rounded-[8px] border border-border bg-white p-3 shadow-[0_12px_40px_-32px_rgba(0,0,0,0.28)]">
              <div className="mb-2 flex items-center gap-2 px-2 py-1 text-xs font-semibold text-[var(--brand-ink)]">
                <FileText className="h-4 w-4" aria-hidden="true" />
                研究卡结构
              </div>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-[6px] px-2.5 py-2 text-sm leading-snug text-[oklch(0.45_0.018_160)] transition-colors hover:bg-[var(--brand-soft)] hover:text-[var(--brand-ink)]"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
