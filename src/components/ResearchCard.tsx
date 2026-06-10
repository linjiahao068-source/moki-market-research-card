'use client';

import { ResearchCard as ResearchCardType } from '@/types/research-card';
import { ResearchCardSection } from './ResearchCardSection';
import { EvidenceItem } from './EvidenceItem';
import { DisclaimerBox } from './DisclaimerBox';

interface ResearchCardProps {
  card: ResearchCardType;
}

export function ResearchCard({ card }: ResearchCardProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 页面头部 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Moki Market Research Card</h1>
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm mb-4">
            <span>Sample / Mock</span>
          </div>
        </div>

        {/* 卡片头部 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900">{card.ticker}</span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-700">{card.companyName}</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              更新于 {card.updatedAt}
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{card.title}</h2>
          <p className="text-gray-600">{card.subtitle}</p>
        </div>

        {/* 1. 一句话摘要 */}
        <ResearchCardSection title="1. 一句话摘要">
          <p className="text-gray-700">{card.summary}</p>
        </ResearchCardSection>

        {/* 2. X 舆情面 */}
        <ResearchCardSection title="2. X 舆情面">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <span className="text-sm text-gray-500">讨论热度：</span>
                <span className="font-medium">{card.sentiment.heatLevel}/10</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">情绪方向：</span>
                <span className="font-medium">{card.sentiment.direction}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">分歧程度：</span>
                <span className="font-medium">{(card.sentiment.disagreement * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">关键讨论：</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {card.sentiment.keyDebates.map((debate, idx) => (
                  <li key={idx}>{debate}</li>
                ))}
              </ul>
            </div>
          </div>
        </ResearchCardSection>

        {/* 3. 基本面 */}
        <ResearchCardSection title="3. 基本面">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">商业模式：</p>
              <p className="text-gray-700">{card.fundamentals.businessModel}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">收入驱动：</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {card.fundamentals.revenueDrivers.map((driver, idx) => (
                  <li key={idx}>{driver}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">关键指标：</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {card.fundamentals.keyMetrics.map((metric, idx) => (
                  <div key={idx} className="bg-gray-50 rounded p-3">
                    <div className="text-sm text-gray-500">{metric.label}</div>
                    <div className="font-semibold text-gray-900">{metric.value}</div>
                    {metric.note && <div className="text-xs text-gray-500">{metric.note}</div>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">风险提醒：</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {card.fundamentals.risks.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>
          </div>
        </ResearchCardSection>

        {/* 4. 政策/事件 */}
        <ResearchCardSection title="4. 政策/事件">
          <div className="space-y-4">
            {card.events.product.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-1">产品动态：</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {card.events.product.map((event, idx) => (
                    <li key={idx}>{event}</li>
                  ))}
                </ul>
              </div>
            )}
            {card.events.macro.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-1">宏观观察：</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {card.events.macro.map((event, idx) => (
                    <li key={idx}>{event}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 mb-2">财报日历：</p>
              <div className="space-y-2">
                {card.events.earningsCalendar.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-gray-700">
                    <span className="text-sm text-gray-500 w-32">{item.date}</span>
                    <span>{item.event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ResearchCardSection>

        {/* 5. 技术/交易面 */}
        <ResearchCardSection title="5. 技术/交易面">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">价格走势：</p>
                <p className="text-gray-700 text-sm">{card.technicalContext.priceAction}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">成交量：</p>
                <p className="text-gray-700 text-sm">{card.technicalContext.volume}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">期权 IV：</p>
                <p className="text-gray-700 text-sm">{card.technicalContext.optionsIv}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">关键区间：</p>
              <div className="flex flex-wrap gap-2">
                {card.technicalContext.keyZones.map((zone, idx) => (
                  <div key={idx} className="bg-gray-100 rounded px-3 py-1 text-sm">
                    <span className="text-gray-600">{zone.type}：</span>
                    <span className="font-medium">{zone.level}</span>
                    {zone.note && <span className="text-gray-500 ml-1">({zone.note})</span>}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {card.technicalContext.note}
            </p>
          </div>
        </ResearchCardSection>

        {/* 6. 证据链 */}
        <ResearchCardSection title="6. 证据链">
          <div className="space-y-3">
            {card.evidence.map((ev) => (
              <EvidenceItem key={ev.id} evidence={ev} />
            ))}
          </div>
        </ResearchCardSection>

        {/* 7. 下一步研究 */}
        <ResearchCardSection title="7. 下一步研究">
          <div className="space-y-3">
            {card.nextSteps.map((step, idx) => (
              <div key={idx} className="border-l-4 border-blue-400 pl-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-900">{step.task}</p>
                  <span className="text-xs text-gray-500">关注：{step.followUpDate}</span>
                </div>
                <p className="text-sm text-gray-600">{step.whyItMatters}</p>
              </div>
            ))}
          </div>
        </ResearchCardSection>

        {/* 8. 免责声明 */}
        <DisclaimerBox text={card.disclaimer} />
      </div>
    </div>
  );
}
