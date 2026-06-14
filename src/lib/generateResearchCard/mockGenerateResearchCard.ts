import { BasicCompanyData } from '@/types/basic-data';
import { ResearchCard } from '@/types/research-card';
import { SecurityRecord, SecurityResolution } from '@/types/security';
import { resolveSecurityInput } from '@/lib/security/resolveSecurityInput';

export const cardTypeOptions = [
  {
    value: 'ai-cloud-radar',
    label: 'AI Cloud Radar',
    description: '聚焦云厂商、AI 基础设施、capex 和收入兑现节奏。',
  },
  {
    value: 'sentiment-radar',
    label: 'Sentiment Radar',
    description: '聚焦 X 舆情热度、KOL 分歧和短期叙事扩散。',
  },
  {
    value: 'software-ai-impact',
    label: 'Software AI Impact',
    description: '聚焦软件公司如何受到 AI 产品化和企业预算变化影响。',
  },
] as const;

export type GenerateCardType = (typeof cardTypeOptions)[number]['value'];

const MOCK_UPDATED_AT = '2026-06-14';
const MOCK_DATE_SLUG = '20260614';
const SOURCE_NOTE = '当前结果结合 Moki Market V0.2.5 基础数据接入层和 mock generator 生成，仅用于产品体验验证，不构成投资建议。';
const FALLBACK_SOURCE_NOTE = `${SOURCE_NOTE} 当前证券未匹配到 mock 主数据，已按输入生成通用研究卡雏形。`;

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
  const commonPrefix = `${displaySymbol} / ${companyName} 当前 mock 研究主题为 ${theme}`;

  const copy: Record<GenerateCardType, CardTypeCopy> = {
    'ai-cloud-radar': {
      subtitle: 'AI 云收入、CapEx 和订单兑现节奏的 mock 观察卡',
      oneLine: `${commonPrefix}。本卡优先观察 AI 云收入、CapEx、数据中心建设和 RPO / 订单转收入节奏。`,
      bullCase: 'AI 云需求持续，数据中心投入逐步转化为可见收入，订单或 RPO 具备后续兑现线索。',
      bearCase: 'CapEx 周期拉长、数据中心交付慢于预期，订单转收入节奏不足以支撑市场叙事。',
      keyQuestion: 'AI 云叙事能否从订单和基础设施投入，转化为可复盘的收入兑现？',
      sections: [
        { title: 'AI 云收入', body: '关注云业务或 AI 基础设施相关收入是否出现明确增长线索。' },
        { title: 'CapEx', body: '观察数据中心和算力投入是否带来现金流、折旧或利润率压力。' },
        { title: '数据中心', body: '关注供给、区域扩张、客户部署和交付节奏。' },
        { title: 'RPO / 订单转收入', body: '把订单、剩余履约义务和收入确认节奏拆开复盘。' },
      ],
      keySignals: ['AI 云收入增速', 'CapEx 指引变化', '数据中心交付节点', 'RPO 或订单转收入节奏'],
      risks: ['高投入周期超预期', '客户部署节奏放缓', 'AI 云竞争加剧', '订单无法按预期转化为收入'],
      revenueDrivers: ['AI 云收入', '数据中心容量扩张', '企业客户 AI 需求', '订单或 RPO 兑现'],
      keyMetrics: [
        { label: 'AI 云收入', description: 'sample/mock：观察收入兑现', whyItMatters: '用于判断 AI 叙事是否进入财务验证阶段。' },
        { label: 'CapEx', description: 'sample/mock：观察投入强度', whyItMatters: '用于评估高投入是否影响现金流和利润率。' },
        { label: 'RPO / 订单', description: 'sample/mock：观察未来收入池', whyItMatters: '用于复盘订单能否转成可见收入。' },
      ],
      events: [
        { type: 'mock-cloud', title: 'AI 云需求线索', description: 'sample/mock：需要补充财报、客户和管理层指引。', impactQuestion: 'AI 云需求是否有可验证收入线索？' },
        { type: 'mock-capex', title: '数据中心投入观察', description: 'sample/mock：关注 CapEx 与交付节奏。', impactQuestion: '投入是否能形成后续收入兑现？' },
      ],
    },
    'sentiment-radar': {
      subtitle: '市场情绪、X/TikTok 叙事和短期波动的 mock 观察卡',
      oneLine: `${commonPrefix}。本卡优先观察市场情绪、X/TikTok 叙事、短期波动和多空分歧。`,
      bullCase: '正向叙事获得更多证据补充，市场讨论从情绪扩散逐步转向基本面验证。',
      bearCase: '短期波动主要由叙事推动，缺少公告、财报或行业数据支撑。',
      keyQuestion: '当前情绪变化来自证据链更新，还是来自社交平台叙事扩散？',
      sections: [
        { title: '市场情绪', body: '记录讨论热度、情绪方向和分歧强度。' },
        { title: 'X/TikTok 叙事', body: '区分短视频观点、KOL 解读和一手来源。' },
        { title: '短期波动', body: '把波动作为背景，不形成操作建议。' },
        { title: '多空分歧', body: '整理乐观叙事、谨慎叙事和待核查问题。' },
      ],
      keySignals: ['X / TikTok 讨论热度', '关键 KOL 分歧', '新闻触发点', '短期波动来源'],
      risks: ['情绪扩散快于证据', '单条新闻被过度解读', '短期波动放大叙事偏差', '多空分歧缺少共同事实基础'],
      revenueDrivers: ['市场叙事变化', '新闻事件触发', '社交平台讨论热度', '基本面证据补充'],
      keyMetrics: [
        { label: '情绪热度', description: 'sample/mock：观察讨论密度', whyItMatters: '用于判断研究问题是否正在被市场集中讨论。' },
        { label: '分歧强度', description: 'sample/mock：观察多空叙事差异', whyItMatters: '用于定位最需要核查的争议点。' },
        { label: '新闻触发点', description: 'sample/mock：观察事件来源', whyItMatters: '用于区分事实变化和观点扩散。' },
      ],
      events: [
        { type: 'mock-social', title: 'X/TikTok 叙事升温', description: 'sample/mock：需要整理社交平台主要观点。', impactQuestion: '讨论热度是否有一手来源支撑？' },
        { type: 'mock-news', title: '新闻触发点待核查', description: 'sample/mock：需要回到公告和权威新闻。', impactQuestion: '新闻是否真正改变研究问题？' },
      ],
    },
    'software-ai-impact': {
      subtitle: 'AI 对软件公司影响、数据平台价值和估值压力的 mock 观察卡',
      oneLine: `${commonPrefix}。本卡优先观察 AI 对软件公司的替代风险、使用量提升、数据平台价值和估值压力。`,
      bullCase: 'AI 功能提高产品使用量和客户粘性，数据平台价值在企业 AI 应用中被重新定价。',
      bearCase: 'AI 替代风险提升，客户预算向基础设施或模型层迁移，软件估值承压。',
      keyQuestion: 'AI 是提升软件使用量和数据价值，还是压缩传统软件定价权？',
      sections: [
        { title: '替代风险', body: '观察 AI 是否减少传统软件席位、工作流或开发需求。' },
        { title: '使用量提升', body: '关注 AI 功能是否带来更多调用、数据处理或订阅升级。' },
        { title: '数据平台价值', body: '判断数据治理、开发者生态和 AI 后端是否形成壁垒。' },
        { title: '估值压力', body: '复盘增长放缓、利润率和 AI 投入对估值叙事的影响。' },
      ],
      keySignals: ['AI 功能采用', '使用量或订阅变化', '数据平台客户需求', '估值倍数压力'],
      risks: ['AI 替代传统软件需求', '企业预算转向基础设施层', 'AI 投入拖累利润率', '估值叙事先于收入兑现'],
      revenueDrivers: ['AI 产品功能', '企业订阅与续费', '数据平台使用量', '开发者应用后端需求'],
      keyMetrics: [
        { label: 'AI 功能采用', description: 'sample/mock：观察客户使用', whyItMatters: '用于判断 AI 是否提升产品价值。' },
        { label: '订阅 / 使用量', description: 'sample/mock：观察商业化', whyItMatters: '用于判断 AI 是否转化为收入线索。' },
        { label: '估值压力', description: 'sample/mock：观察市场叙事', whyItMatters: '用于复盘增长预期和风险定价。' },
      ],
      events: [
        { type: 'mock-product', title: 'AI 功能产品化观察', description: 'sample/mock：需要补充产品发布和客户案例。', impactQuestion: 'AI 功能是否提升软件使用量？' },
        { type: 'mock-valuation', title: '软件估值压力复盘', description: 'sample/mock：关注增长、利润率和 AI 投入。', impactQuestion: '估值压力来自基本面变化还是叙事变化？' },
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

export function mockGenerateResearchCard({
  rawInput,
  cardType,
  selectedSecurity,
  basicData,
}: {
  rawInput: string;
  cardType: GenerateCardType;
  selectedSecurity?: SecurityRecord;
  basicData?: BasicCompanyData;
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
  const basicDataSection = buildBasicDataSection(basicData);
  const sections = basicDataSection ? [basicDataSection, ...copy.sections] : copy.sections;
  const oneLine = basicData && basicData.provider !== 'mock'
    ? `${copy.oneLine} 本卡已结合 ${basicData.provider} 基础数据快照，但仍需人工复核。`
    : copy.oneLine;
  const displayName = security.companyName;
  const title = resolution.status === 'matched'
    ? `${displayName} ${cardTypeLabel}`
    : `${rawInput} 通用研究卡`;

  return {
    ok: true,
    resolution,
    card: {
      slug: `${slugSymbol}-${cardType}-${MOCK_DATE_SLUG}`,
      ticker: displaySymbol,
      companyName: security.companyName,
      title,
      subtitle: copy.subtitle,
      cardType,
      updatedAt: MOCK_UPDATED_AT,
      isMock: true,
      summary: {
        oneLine,
        currentState: copy.bullCase,
        bullCase: copy.bullCase,
        bearCase: copy.bearCase,
        keyQuestion: copy.keyQuestion,
      },
      sentiment: {
        heatLevel: 7.2,
        direction: `${cardType}-mock-state`,
        disagreement: 0.68,
        keyDebates: [copy.bullCase, copy.bearCase, copy.keyQuestion],
      },
      fundamentals: {
        businessModel: `${security.companyName} 当前 mock 主题为 ${security.theme ?? 'general market research context'}。需要后续补充真实财报、新闻和公告来源。`,
        revenueDrivers: copy.revenueDrivers,
        keyMetrics: copy.keyMetrics,
        risks: copy.risks,
      },
      events: {
        items: copy.events,
      },
      technicalContext: {
        priceAction: 'sample/mock：价格波动只作为市场背景，不形成操作建议。',
        volume: 'sample/mock：成交变化需要结合新闻、财报和舆情复盘。',
        optionsIv: 'sample/mock：IV 只能作为不确定性背景线索。',
        keyZones: [
          { type: '观察区间', level: 'sample range A', note: '仅作为背景信息' },
          { type: '观察区间', level: 'sample range B', note: '用于复盘波动来源' },
        ],
        note: '技术/交易面仅用于理解市场背景，不构成操作建议。',
      },
      evidence: [
        {
          id: `${slugSymbol.toLowerCase()}-${cardType}-mock-001`,
          sourceLabel: 'Sample 财报与新闻清单',
          sourceType: 'mock-source-checklist',
          timestamp: MOCK_UPDATED_AT,
          summary: '[Mock] 需要补充真实财报、公告、新闻和社交平台来源。',
          confidence: 0.55,
        },
      ],
      nextSteps: copy.keySignals.slice(0, 3).map((signal) => ({
        task: `核查 ${signal}`,
        whyItMatters: '把 mock 研究问题转化为后续可追踪、可复盘的任务。',
        followUpDate: '2026-06-30',
      })),
      disclaimer: '仅供信息整理、研究辅助和教育参考，不构成投资建议。',
      sections,
      keySignals: copy.keySignals,
      risks: copy.risks,
      sourceNote: resolution.status === 'unmatched' ? FALLBACK_SOURCE_NOTE : SOURCE_NOTE,
      queryInput: rawInput,
      market: security.market,
      numericCode: security.numericCode,
      chineseName: security.chineseNameHK,
      matchStatus: resolution.status,
      matchType: resolution.status === 'matched' ? resolution.matchType : undefined,
    },
  };
}
