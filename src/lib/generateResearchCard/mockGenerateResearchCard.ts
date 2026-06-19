import type { BasicCompanyData } from '@/types/basic-data';
import type { EarningsSnapshotData, GuidanceMetricComparison } from '@/types/earnings';
import type { Evidence, ResearchCard, ResearchEvent } from '@/types/research-card';
import type { SecurityRecord, SecurityResolution } from '@/types/security';
import { formatEps, formatMoneyCompact, formatPercent } from '@/lib/earnings/formatEarningsValue';
import { buildResearchDataLayer } from '@/lib/research/factBuilder';
import { getBullBaseBearScenarios } from '@/lib/scenarios/providers';
import { resolveSecurityInput } from '@/lib/security/resolveSecurityInput';
import { generateSerenityBundleFromRealData } from '@/lib/serenity';

export const cardTypeOptions = [
  {
    value: 'executive-investment-view',
    label: 'Executive Investment View',
    description: '统一输出财报、公司指引、买方情景和证据引用的执行视图。',
  },
] as const;

export type GenerateCardType = (typeof cardTypeOptions)[number]['value'];

export const DEFAULT_GENERATE_CARD_TYPE: GenerateCardType = 'executive-investment-view';

const REPORT_UPDATED_AT = '2026-06-18';
const REPORT_DATE_SLUG = '20260618';
const SOURCE_NOTE = '当前结果结合 Moki Market 数据接入层、研究事实层和报告生成结构整理；仅供研究辅助，不构成投资建议。';
const FALLBACK_SOURCE_NOTE = `${SOURCE_NOTE} 当前证券未匹配到证券主数据，已按输入生成待补齐的通用研究视图。`;
const REAL_DATA_SOURCE_NOTE = '当前结果结合 Moki Market 真实数据接入层生成，包含基础数据、财报快照、指引证据、三情景演算和 Serenity 分析；仅供研究辅助，不构成投资建议。';

interface CardTypeCopy {
  subtitle: string;
  oneLine: string;
  bullCase: string;
  bearCase: string;
  keyQuestion: string;
  sections: Array<{
    title: string;
    body: string;
  }>;
  keySignals: string[];
  risks: string[];
  revenueDrivers: string[];
  keyMetrics: Array<{
    label: string;
    description: string;
    whyItMatters: string;
  }>;
  events: Array<{
    type: string;
    title: string;
    description: string;
    impactQuestion: string;
  }>;
}

export function isGenerateCardType(value: string): value is GenerateCardType {
  return cardTypeOptions.some((option) => option.value === value);
}

function getCardTypeLabel(cardType: GenerateCardType) {
  return cardTypeOptions.find((option) => option.value === cardType)?.label ?? cardTypeOptions[0].label;
}

function buildCopy(displaySymbol: string, companyName: string, theme: string, cardType: GenerateCardType): CardTypeCopy {
  const commonPrefix = `${displaySymbol} / ${companyName} 当前研究主题为 ${theme}`;

  const copy: Record<GenerateCardType, CardTypeCopy> = {
    'executive-investment-view': {
      subtitle: '财报、指引、情景和证据引用的执行视图',
      oneLine: `${commonPrefix}。本视图优先整理本期财报表现、管理层指引、买方情景推演和仍需复核的证据缺口。`,
      bullCase: '收入、EPS 或关键业务指标继续兑现，管理层指引和外部需求线索支持基本面延续。',
      bearCase: '数据覆盖不足、指引不清晰或关键业务指标走弱，使市场叙事先于可复核证据。',
      keyQuestion: '当前可验证证据是否足以支持下一阶段的基本面判断？',
      sections: [
        { title: 'Executive Summary', body: '把最需要先读的结论、关键问题和证据缺口放在首屏。' },
        { title: 'Earnings & Guidance', body: '对齐单季度 actual、consensus、management guidance 和缺失原因。' },
        { title: 'Scenario Map', body: '把 Bull / Base / Bear 情景拆成变量、触发条件和待验证事项。' },
        { title: 'Evidence References', body: '保留来源、更新时间和摘录，并进入统一 References 结构。' },
      ],
      keySignals: ['收入与 EPS 兑现', '管理层指引变化', '关键业务指标', 'Bull/Base/Bear 触发条件', '证据缺口'],
      risks: ['数据覆盖不足', '指引与共识口径不一致', '关键业务指标走弱', '情景假设缺少来源支撑'],
      revenueDrivers: ['核心收入线索', '利润率与 EPS 变化', '管理层指引', '外部需求证据', '情景变量'],
      keyMetrics: [
        { label: '收入与 EPS', description: '优先检查实际值、预期差距和同比变化', whyItMatters: '用于判断本期业绩是否形成可验证的基本面变化。' },
        { label: '管理层指引', description: '整理下一季度或全年收入、EPS 和业务口径', whyItMatters: '用于判断公司自身预期和市场共识是否一致。' },
        { label: '情景变量', description: '记录 Bull/Base/Bear 的核心假设和触发条件', whyItMatters: '用于把观点拆成后续可复盘的研究任务。' },
      ],
      events: [
        { type: 'earnings-review', title: '财报与指引复核', description: '需要对齐财报、新闻稿、管理层电话会和第三方预期来源。', impactQuestion: '本期 actual 与 guidance 是否改变核心研究问题？' },
        { type: 'evidence-gap', title: '证据缺口补齐', description: '标记缺失来源、文本抽取失败或口径不一致的项目。', impactQuestion: '哪些证据必须补齐后才能形成更高质量的 ResearchReport？' },
      ],
    },
  };

  return copy[cardType];
}

export type MockGenerateResearchCardResult =
  | {
      ok: true;
      card: ResearchCard;
      resolution: Extract<SecurityResolution, { status: 'matched' | 'unmatched' }>;
    }
  | {
      ok: false;
      error: string;
      resolution: Extract<SecurityResolution, { status: 'ambiguous' }>;
    };

function valueOrDash(value?: string) {
  return value || '--';
}

function getEarningsMetric(earningsSnapshot: EarningsSnapshotData, metricKey: 'revenue' | 'netIncome' | 'eps') {
  return earningsSnapshot.metrics.find((metric) => metric.metricKey === metricKey);
}

function formatMetricActual(earningsSnapshot: EarningsSnapshotData, metricKey: 'revenue' | 'netIncome' | 'eps') {
  const metric = getEarningsMetric(earningsSnapshot, metricKey);

  if (!metric) {
    return '--';
  }

  return metricKey === 'eps' ? formatEps(metric.actual) : formatMoneyCompact(metric.actual, metric.currency ?? 'USD');
}

function formatMetricSurprise(earningsSnapshot: EarningsSnapshotData, metricKey: 'revenue' | 'eps') {
  const metric = getEarningsMetric(earningsSnapshot, metricKey);

  if (!metric || metric.estimate === undefined) {
    return '预测值缺失，未计算较预期差距';
  }

  return formatPercent(metric.surprisePct);
}

function formatMetricYoy(earningsSnapshot: EarningsSnapshotData, metricKey: 'revenue' | 'netIncome') {
  const metric = getEarningsMetric(earningsSnapshot, metricKey);

  return formatPercent(metric?.yoyPct);
}

function summarizeGuidance(guidance: GuidanceMetricComparison[]) {
  if (guidance.length === 0) {
    return '未提取到结构化公司指引';
  }

  return guidance
    .map((item) => {
      const status = item.quality === 'extracted' ? '文本抽取，待复核' : item.quality === 'verified' ? '已验证' : '待补充';
      return `${item.label}：${status}`;
    })
    .join('；');
}

function normalizeRealCopy(text: string) {
  return text
    .replace(/sample\/mock：/g, '')
    .replace(/当前 mock 研究主题为/g, '当前研究主题为')
    .replace(/当前 mock 主题为/g, '当前研究主题为')
    .replace(/的 mock 观察卡/g, '观察卡')
    .replace(/ mock /g, ' ')
    .replace(/ mock/g, '')
    .trim();
}

function normalizeMetricCopy(metrics: CardTypeCopy['keyMetrics']): CardTypeCopy['keyMetrics'] {
  return metrics.map((metric) => ({
    ...metric,
    description: normalizeRealCopy(metric.description),
    whyItMatters: normalizeRealCopy(metric.whyItMatters),
  }));
}

function normalizeEventCopy(events: ResearchEvent[]): ResearchEvent[] {
  return events.map((event) => ({
    ...event,
    title: normalizeRealCopy(event.title),
    description: normalizeRealCopy(event.description),
    impactQuestion: normalizeRealCopy(event.impactQuestion),
  }));
}

function isRealBasicData(basicData?: BasicCompanyData) {
  return !!basicData &&
    basicData.provider !== 'mock' &&
    basicData.coverageStatus !== 'empty' &&
    basicData.coverageStatus !== 'failed';
}

function isRealEarningsSnapshot(earningsSnapshotData?: EarningsSnapshotData) {
  return !!earningsSnapshotData && earningsSnapshotData.provider !== 'mock';
}

function getEnhancedScore(earningsSnapshotData?: EarningsSnapshotData) {
  const maybeEnhanced = earningsSnapshotData as (EarningsSnapshotData & { dataQualityScore?: number }) | undefined;
  return maybeEnhanced?.dataQualityScore;
}

function getGuidanceMeta(earningsSnapshotData?: EarningsSnapshotData) {
  return earningsSnapshotData as (EarningsSnapshotData & {
    guidanceSource?: string;
    guidanceConfidence?: number;
  }) | undefined;
}

function buildEarningsSnapshotSection(earningsSnapshotData?: EarningsSnapshotData) {
  if (!earningsSnapshotData) {
    return undefined;
  }

  return {
    title: '单季度财报快照',
    body: [
      `营收公布值：${formatMetricActual(earningsSnapshotData, 'revenue')}`,
      `营收较预期：${formatMetricSurprise(earningsSnapshotData, 'revenue')}`,
      `营收同比：${formatMetricYoy(earningsSnapshotData, 'revenue')}`,
      `净利润公布值：${formatMetricActual(earningsSnapshotData, 'netIncome')}`,
      `EPS 公布值：${formatMetricActual(earningsSnapshotData, 'eps')}`,
      `EPS 较预期：${formatMetricSurprise(earningsSnapshotData, 'eps')}`,
      `指引摘要：${summarizeGuidance(earningsSnapshotData.guidance)}`,
    ].join('\n'),
  };
}

function buildBasicDataSection(basicData?: BasicCompanyData) {
  if (!basicData) {
    return undefined;
  }

  const financials = basicData.financials ?? {};
  const latestFiling = basicData.latestFiling;
  const fallbackText = basicData.provider === 'mock' ? ' 当前基础数据来自 mock fallback。' : '';

  return {
    title: '基础数据快照',
    body: [
      `数据来源：${basicData.provider}`,
      `最近 filing：${valueOrDash(latestFiling?.formType)} / ${valueOrDash(latestFiling?.filingDate)}`,
      `Revenue：${valueOrDash(financials.revenue)}`,
      `Net income：${valueOrDash(financials.netIncome)}`,
      `Assets：${valueOrDash(financials.assets)}`,
      `Cash：${valueOrDash(financials.cashAndEquivalents)}`,
      `数据覆盖状态：${basicData.coverageStatus}`,
      fallbackText.trim(),
    ].filter(Boolean).join('\n'),
  };
}

function buildKeyMetricsFromData(
  fallbackMetrics: CardTypeCopy['keyMetrics'],
  basicData?: BasicCompanyData,
  earningsSnapshotData?: EarningsSnapshotData
): CardTypeCopy['keyMetrics'] {
  const metrics: CardTypeCopy['keyMetrics'] = [];

  if (earningsSnapshotData) {
    const revenue = getEarningsMetric(earningsSnapshotData, 'revenue');
    const eps = getEarningsMetric(earningsSnapshotData, 'eps');

    if (revenue?.actual !== undefined || revenue?.estimate !== undefined) {
      metrics.push({
        label: 'Revenue',
        description: `actual ${formatMetricActual(earningsSnapshotData, 'revenue')} / consensus ${revenue.estimate !== undefined ? formatMoneyCompact(revenue.estimate, revenue.currency ?? 'USD') : '--'}`,
        whyItMatters: `YoY ${formatMetricYoy(earningsSnapshotData, 'revenue')}，用于复盘收入兑现质量。`,
      });
    }

    if (eps?.actual !== undefined || eps?.estimate !== undefined) {
      metrics.push({
        label: 'EPS',
        description: `actual ${formatMetricActual(earningsSnapshotData, 'eps')} / consensus ${eps.estimate !== undefined ? formatEps(eps.estimate) : '--'}`,
        whyItMatters: `较预期 ${formatMetricSurprise(earningsSnapshotData, 'eps')}，用于观察利润兑现。`,
      });
    }
  }

  if (basicData?.financials?.cashAndEquivalents) {
    metrics.push({
      label: 'Cash',
      description: basicData.financials.cashAndEquivalents,
      whyItMatters: '用于观察资产负债表缓冲和投入能力。',
    });
  }

  return [...metrics, ...fallbackMetrics].slice(0, 6);
}

function buildEventsFromData(
  fallbackEvents: ResearchEvent[],
  basicData?: BasicCompanyData,
  earningsSnapshotData?: EarningsSnapshotData
): ResearchEvent[] {
  const events: ResearchEvent[] = [];

  if (earningsSnapshotData?.reportDate || earningsSnapshotData?.earningsDate) {
    events.push({
      type: 'earnings-snapshot',
      title: '财报快照更新',
      description: [
        earningsSnapshotData.reportDate ? `报告期 ${earningsSnapshotData.reportDate}` : undefined,
        earningsSnapshotData.earningsDate ? `财报日 ${earningsSnapshotData.earningsDate}` : undefined,
        `来源 ${earningsSnapshotData.provider}`,
      ].filter(Boolean).join(' / '),
      impactQuestion: '财报数据是否改变原有研究假设？',
    });
  }

  if (basicData?.latestFiling) {
    events.push({
      type: 'filing',
      title: `${basicData.latestFiling.formType ?? 'Filing'} 文件更新`,
      description: `filing date ${basicData.latestFiling.filingDate ?? '--'}，source ${basicData.provider}`,
      impactQuestion: '最新文件是否补充了收入、利润或风险披露线索？',
    });
  }

  const firstEvidence = earningsSnapshotData?.guidanceEvidence?.[0];
  if (firstEvidence) {
    events.push({
      type: 'guidance-evidence',
      title: firstEvidence.title ?? '指引证据更新',
      description: firstEvidence.snippet ?? firstEvidence.source ?? 'guidance-related evidence',
      impactQuestion: '该证据是否提供了可复核的管理层或市场预期线索？',
    });
  }

  return [...events, ...fallbackEvents].slice(0, 6);
}

function buildEvidenceChain({
  slugSymbol,
  cardType,
  basicData,
  earningsSnapshotData,
}: {
  slugSymbol: string;
  cardType: GenerateCardType;
  basicData?: BasicCompanyData;
  earningsSnapshotData?: EarningsSnapshotData;
}): Evidence[] {
  const evidence: Evidence[] = [];

  basicData?.sourceLinks?.slice(0, 3).forEach((link, index) => {
    evidence.push({
      id: `${slugSymbol}-${cardType}-basic-${index + 1}`,
      sourceLabel: link.label,
      sourceType: basicData.provider,
      timestamp: basicData.fetchedAt,
      summary: `基础数据来源：${link.label}`,
      confidence: isRealBasicData(basicData) ? 0.75 : 0.45,
    });
  });

  earningsSnapshotData?.sourceLinks?.slice(0, 3).forEach((link, index) => {
    evidence.push({
      id: `${slugSymbol}-${cardType}-earnings-${index + 1}`,
      sourceLabel: link.label,
      sourceType: earningsSnapshotData.provider,
      timestamp: earningsSnapshotData.fetchedAt,
      summary: `财报快照来源：${link.label}`,
      confidence: isRealEarningsSnapshot(earningsSnapshotData) ? 0.7 : 0.45,
    });
  });

  earningsSnapshotData?.guidanceEvidence?.slice(0, 3).forEach((item, index) => {
    evidence.push({
      id: `${slugSymbol}-${cardType}-guidance-${index + 1}`,
      sourceLabel: item.title ?? item.source ?? 'Guidance evidence',
      sourceType: item.source ?? 'guidance-evidence',
      timestamp: item.publishedAt ?? earningsSnapshotData.fetchedAt,
      summary: item.snippet ?? '指引相关证据，需结合原文复核。',
      confidence: item.extracted ? 0.65 : 0.45,
    });
  });

  if (evidence.length > 0) {
    return evidence;
  }

  return [
    {
      id: `${slugSymbol.toLowerCase()}-${cardType}-source-checklist-001`,
      sourceLabel: '待补齐来源清单',
      sourceType: 'source-checklist',
      timestamp: REPORT_UPDATED_AT,
      summary: '需要补充真实财报、公告、新闻和原始来源。',
      confidence: 0.55,
    },
  ];
}

function buildRealDataSections(
  copySections: CardTypeCopy['sections'],
  basicData?: BasicCompanyData,
  earningsSnapshotData?: EarningsSnapshotData
) {
  const earningsSnapshotSection = buildEarningsSnapshotSection(earningsSnapshotData);
  const basicDataSection = buildBasicDataSection(basicData);
  const guidanceSection = earningsSnapshotData && (
    earningsSnapshotData.guidance.length > 0 || (earningsSnapshotData.guidanceEvidence?.length ?? 0) > 0
  )
    ? {
        title: '公司指引与证据',
        body: [
          `结构化指引：${summarizeGuidance(earningsSnapshotData.guidance)}`,
          `证据数量：${earningsSnapshotData.guidanceEvidence?.length ?? 0}`,
          `来源：${getGuidanceMeta(earningsSnapshotData)?.guidanceSource ?? earningsSnapshotData.provider}`,
        ].join('\n'),
      }
    : undefined;

  return [earningsSnapshotSection, basicDataSection, guidanceSection, ...copySections].filter(
    (section): section is { title: string; body: string } => Boolean(section)
  );
}

function buildDataQuality(
  basicData?: BasicCompanyData,
  earningsSnapshotData?: EarningsSnapshotData
): ResearchCard['dataQuality'] {
  const realBasicData = isRealBasicData(basicData);
  const realEarningsData = isRealEarningsSnapshot(earningsSnapshotData);
  const score = getEnhancedScore(earningsSnapshotData);
  const fallbackScore = Math.min(10, (realBasicData ? 3 : 0) + (realEarningsData ? 4 : 0) + ((earningsSnapshotData?.guidanceEvidence?.length ?? 0) > 0 ? 1 : 0));
  const sources = [
    realBasicData ? basicData?.provider : undefined,
    realEarningsData ? earningsSnapshotData?.provider : undefined,
    earningsSnapshotData?.guidanceEvidence?.length ? 'guidance evidence' : undefined,
  ].filter(Boolean);

  return {
    score: score ?? fallbackScore,
    sourceSummary: sources.length > 0 ? sources.join(' + ') : 'fallback',
    realDataAvailable: realBasicData || realEarningsData,
    coverageStatus: basicData?.coverageStatus,
    warnings: [
      ...(basicData?.warnings ?? []),
      ...(earningsSnapshotData?.warnings ?? []),
    ].slice(0, 8),
  };
}

export function mockGenerateResearchCard({
  rawInput,
  cardType,
  selectedSecurity,
  basicData,
  earningsSnapshotData,
  useRealData = false,
}: {
  rawInput: string;
  cardType: GenerateCardType;
  selectedSecurity?: SecurityRecord;
  basicData?: BasicCompanyData;
  earningsSnapshotData?: EarningsSnapshotData;
  useRealData?: boolean;
}): MockGenerateResearchCardResult {
  const resolution = selectedSecurity
    ? ({
        status: 'matched',
        inputKind: selectedSecurity.symbol ? 'symbol' : selectedSecurity.numericCode ? 'numericCode' : 'chineseName',
        matchType: selectedSecurity.symbol ? 'symbol' : selectedSecurity.numericCode ? 'numericCode' : 'chineseName',
        rawInput,
        normalizedInput: selectedSecurity.symbol ?? selectedSecurity.numericCode ?? selectedSecurity.chineseNameHK ?? rawInput,
        security: selectedSecurity,
      } satisfies Extract<SecurityResolution, { status: 'matched' }>)
    : resolveSecurityInput(rawInput);

  if (resolution.status === 'ambiguous') {
    return {
      ok: false,
      error: '匹配到多个证券，请输入更精确的股票代码、Ticker 或中文名。',
      resolution,
    };
  }

  const security = resolution.status === 'matched' ? resolution.security : resolution.fallbackSecurity;
  const displaySymbol = security.symbol ?? security.numericCode ?? resolution.normalizedInput;
  const slugSymbol = (security.symbol ?? security.numericCode ?? resolution.normalizedInput ?? security.id)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  const cardTypeLabel = getCardTypeLabel(cardType);
  const copy = buildCopy(displaySymbol, security.companyName, security.theme ?? 'general market research context', cardType);
  const dataQuality = buildDataQuality(basicData, earningsSnapshotData);
  const realDataAvailable = useRealData && Boolean(dataQuality?.realDataAvailable);
  const displayCopy = realDataAvailable
    ? {
        ...copy,
        subtitle: normalizeRealCopy(copy.subtitle),
        oneLine: normalizeRealCopy(copy.oneLine),
        bullCase: normalizeRealCopy(copy.bullCase),
        bearCase: normalizeRealCopy(copy.bearCase),
        keyQuestion: normalizeRealCopy(copy.keyQuestion),
        sections: copy.sections.map((section) => ({
          title: normalizeRealCopy(section.title),
          body: normalizeRealCopy(section.body),
        })),
        keySignals: copy.keySignals.map(normalizeRealCopy),
        risks: copy.risks.map(normalizeRealCopy),
        revenueDrivers: copy.revenueDrivers.map(normalizeRealCopy),
        keyMetrics: normalizeMetricCopy(copy.keyMetrics),
        events: normalizeEventCopy(copy.events),
      }
    : copy;
  const sections = realDataAvailable
    ? buildRealDataSections(displayCopy.sections, basicData, earningsSnapshotData)
    : buildRealDataSections(displayCopy.sections, undefined, undefined);
  const keyMetrics = realDataAvailable
    ? buildKeyMetricsFromData(displayCopy.keyMetrics, basicData, earningsSnapshotData)
    : displayCopy.keyMetrics;
  const events = realDataAvailable
    ? buildEventsFromData(displayCopy.events, basicData, earningsSnapshotData)
    : displayCopy.events;
  const advancedScenarios = realDataAvailable
    ? getBullBaseBearScenarios({
        ticker: displaySymbol,
        companyName: security.companyName,
        basicData,
        earningsSnapshot: earningsSnapshotData,
      })
    : undefined;
  const researchDataLayer = buildResearchDataLayer({
    ticker: displaySymbol,
    basicData,
    earningsSnapshot: earningsSnapshotData,
    scenarios: advancedScenarios,
  });
  const serenityAnalysis = realDataAvailable
    ? generateSerenityBundleFromRealData({
        ticker: displaySymbol,
        companyName: security.companyName,
        security,
        basicData,
        earningsSnapshot: earningsSnapshotData,
      })
    : undefined;
  const oneLine = realDataAvailable
    ? `${displayCopy.oneLine} 本卡已结合 ${dataQuality?.sourceSummary ?? '真实数据'}，仍需结合原始来源复核。`
    : displayCopy.oneLine;
  const displayName = security.companyName;
  const title = resolution.status === 'matched'
    ? `${displayName} ${cardTypeLabel}`
    : `${rawInput} 通用研究卡`;

  return {
    ok: true,
    resolution,
    card: {
      slug: `${slugSymbol}-${cardType}-${REPORT_DATE_SLUG}`,
      ticker: displaySymbol,
      companyName: security.companyName,
      title,
      subtitle: displayCopy.subtitle,
      cardType,
      updatedAt: REPORT_UPDATED_AT,
      isMock: !realDataAvailable,
      summary: {
        oneLine,
        currentState: copy.bullCase,
        bullCase: displayCopy.bullCase,
        bearCase: displayCopy.bearCase,
        keyQuestion: displayCopy.keyQuestion,
      },
      sentiment: {
        heatLevel: 7.2,
        direction: `${cardType}-mock-state`,
        disagreement: 0.68,
        keyDebates: [copy.bullCase, copy.bearCase, copy.keyQuestion],
      },
      fundamentals: {
        businessModel: realDataAvailable
          ? `${security.companyName} 当前研究主题为 ${security.theme ?? 'general market research context'}。本卡已接入可用基础数据与财报快照，仍需结合原始来源复核。`
          : `${security.companyName} 当前研究主题为 ${security.theme ?? 'general market research context'}。需要后续补充真实财报、新闻和公告来源。`,
        revenueDrivers: displayCopy.revenueDrivers,
        keyMetrics,
        risks: displayCopy.risks,
      },
      events: {
        items: events,
      },
      technicalContext: {
        priceAction: '价格波动只作为市场背景，不形成操作建议。',
        volume: '成交变化需要结合新闻、财报和市场叙事复盘。',
        optionsIv: 'IV 只能作为不确定性背景线索。',
        keyZones: [
          { type: '观察区间', level: 'sample range A', note: '仅作为背景信息' },
          { type: '观察区间', level: 'sample range B', note: '用于复盘波动来源' },
        ],
        note: '技术/交易面仅用于理解市场背景，不构成操作建议。',
      },
      evidence: buildEvidenceChain({ slugSymbol, cardType, basicData, earningsSnapshotData }),
      researchEvidence: researchDataLayer.evidence,
      facts: researchDataLayer.facts,
      factQuality: researchDataLayer.dataQuality,
      llmResearchInput: researchDataLayer.llmInput,
      nextSteps: displayCopy.keySignals.slice(0, 3).map((signal) => ({
        task: `核查 ${signal}`,
        whyItMatters: '把研究问题转化为后续可追踪、可复盘的任务。',
        followUpDate: '2026-06-30',
      })),
      disclaimer: '仅供信息整理、研究辅助和教育参考，不构成投资建议。',
      sections,
      keySignals: displayCopy.keySignals,
      risks: displayCopy.risks,
      sourceNote: realDataAvailable
        ? REAL_DATA_SOURCE_NOTE
        : resolution.status === 'unmatched' ? FALLBACK_SOURCE_NOTE : SOURCE_NOTE,
      queryInput: rawInput,
      market: security.market,
      numericCode: security.numericCode,
      chineseName: security.chineseNameHK,
      matchStatus: resolution.status,
      matchType: resolution.status === 'matched' ? resolution.matchType : undefined,
      valuationScenarios: serenityAnalysis,
      serenityAnalysis,
      enhancedEarnings: realDataAvailable ? earningsSnapshotData : undefined,
      guidanceData: realDataAvailable && earningsSnapshotData ? {
        guidance: earningsSnapshotData.guidance,
        guidanceEvidence: earningsSnapshotData.guidanceEvidence,
        source: getGuidanceMeta(earningsSnapshotData)?.guidanceSource,
        confidence: getGuidanceMeta(earningsSnapshotData)?.guidanceConfidence,
        warnings: earningsSnapshotData.warnings,
      } : undefined,
      advancedScenarios,
      dataQuality,
    },
  };
}

export function generateRealDataResearchCard(
  input: Omit<Parameters<typeof mockGenerateResearchCard>[0], 'useRealData'>
): MockGenerateResearchCardResult {
  return mockGenerateResearchCard({
    ...input,
    useRealData: true,
  });
}
