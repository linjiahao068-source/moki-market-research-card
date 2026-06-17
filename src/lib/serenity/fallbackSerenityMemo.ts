import type { FactRecord, LLMResearchInput } from '@/types/evidence';
import type {
  SerenityMemo,
  SerenityMemoObservation,
  SerenityMemoSkillCard,
  SerenityMemoTone,
  SerenitySkillId,
} from '@/types/serenity-memo';
import type { ResearchBriefProvider } from '@/types/research-brief';

const SKILL_LABELS: Record<SerenitySkillId, string> = {
  buy_side_memo: '买方研究备忘录',
  serenity_alpha: 'Serenity Alpha',
  bayesian: '贝叶斯估值',
  gf_dma: 'GF-DMA 健康指数',
  tam_adj_peg: 'TAM-Adj-PEG',
};

const SKILL_QUESTIONS: Record<SerenitySkillId, string> = {
  buy_side_memo: '把财报、指引、估值和情景推演合成一个可验证的买方研究假设。',
  serenity_alpha: '识别当前证据是否足以形成 Alpha 假设，以及哪些变量会证实或证伪。',
  bayesian: '把新财报和指引证据转译为增长假设的上调、下调或维持。',
  gf_dma: '检查基本面速度、预期修正和情景假设是否支持当前趋势健康度。',
  tam_adj_peg: '把估值倍数、增长速度和市场空间约束放在同一框架里复核。',
};

function formatValue(fact: FactRecord) {
  if (fact.value === undefined || fact.value === null || fact.value === '') {
    return '暂无数据';
  }

  if (typeof fact.value === 'number') {
    if (fact.unit === 'percent') {
      return `${fact.value.toFixed(1)}%`;
    }

    if (fact.unit === 'ratio') {
      return `${(fact.value * 100).toFixed(0)}%`;
    }

    if (fact.unit === 'perShare') {
      return `$${fact.value.toFixed(2)}`;
    }

    if (Math.abs(fact.value) >= 1_000_000_000) {
      return `$${(fact.value / 1_000_000_000).toFixed(1)}B`;
    }

    if (Math.abs(fact.value) >= 1_000_000) {
      return `$${(fact.value / 1_000_000).toFixed(1)}M`;
    }

    return fact.value.toFixed(2).replace(/\.00$/, '');
  }

  return String(fact.value);
}

function compactText(value: string, maxLength = 180) {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
}

function findFacts(input: LLMResearchInput, predicate: (fact: FactRecord) => boolean) {
  return input.facts
    .filter((fact) => fact.quality !== 'missing')
    .filter(predicate)
    .sort((a, b) => b.confidence - a.confidence);
}

function observationFromFact({
  fact,
  title,
  tone = 'neutral',
  prefix,
}: {
  fact: FactRecord;
  title?: string;
  tone?: SerenityMemoTone;
  prefix?: string;
}): SerenityMemoObservation | null {
  if (fact.evidenceIds.length === 0) {
    return null;
  }

  const period = fact.periodLabel ? `（${fact.periodLabel}）` : '';
  const source = fact.source ? `，来源 ${fact.source}` : '';
  const lead = prefix ? `${prefix}：` : '';

  return {
    id: `${fact.id}-memo`,
    title: title ?? fact.label,
    body: compactText(`${lead}${fact.label}${period} 为 ${formatValue(fact)}${source}；质量标记为 ${fact.quality}。`, 260),
    tone,
    confidence: fact.confidence,
    evidenceIds: fact.evidenceIds.slice(0, 4),
    calculationRefs: [fact.id],
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildSkillCard({
  id,
  overview,
  observations,
  variables,
  debates,
  watchItems,
  missingData,
}: {
  id: SerenitySkillId;
  overview: string;
  observations: Array<SerenityMemoObservation | null>;
  variables: string[];
  debates: string[];
  watchItems: string[];
  missingData: string[];
}): SerenityMemoSkillCard {
  const validObservations = observations.filter((item): item is SerenityMemoObservation => Boolean(item));
  const evidenceIds = unique(validObservations.flatMap((item) => item.evidenceIds));
  const calculationRefs = unique(validObservations.flatMap((item) => item.calculationRefs));
  const effectiveMissingData = validObservations.length > 0
    ? missingData
    : unique([...missingData, '缺少可引用 evidenceIds 的事实，暂不生成该框架的强结论。']);

  return {
    id,
    title: SKILL_LABELS[id],
    frameworkQuestion: SKILL_QUESTIONS[id],
    overview: validObservations.length > 0 ? overview : '当前证据不足，先保留框架和待补数据，不输出未经证据支持的判断。',
    observations: validObservations.slice(0, 3),
    variables: variables.slice(0, 5),
    debates: debates.slice(0, 4),
    watchItems: watchItems.slice(0, 5),
    missingData: effectiveMissingData.slice(0, 5),
    evidenceIds,
    calculationRefs,
  };
}

function buildBuySideMemo(input: LLMResearchInput) {
  const financialFacts = findFacts(input, (fact) => fact.kind === 'financial_metric');
  const guidanceFacts = findFacts(input, (fact) => fact.kind === 'guidance_metric');
  const scenarioFacts = findFacts(input, (fact) => fact.kind === 'scenario_output' || fact.kind === 'scenario_input');
  const topFinancial = financialFacts.find((fact) => /actual|yoy|consensus/i.test(fact.label)) ?? financialFacts[0];
  const topGuidance = guidanceFacts[0];
  const topScenario = scenarioFacts[0];

  return buildSkillCard({
    id: 'buy_side_memo',
    overview: '买方备忘录把财报事实、公司指引与情景推演连接成可复核的研究假设。',
    observations: [
      topFinancial ? observationFromFact({ fact: topFinancial, title: '财报事实锚点', tone: 'watch' }) : null,
      topGuidance ? observationFromFact({ fact: topGuidance, title: '管理层指引锚点', tone: 'watch' }) : null,
      topScenario ? observationFromFact({ fact: topScenario, title: '情景推演锚点', tone: 'neutral' }) : null,
    ],
    variables: ['收入增长', 'EPS 或利润率', '管理层指引', '情景概率', '估值倍数'],
    debates: ['增长兑现是否足以支撑估值', '管理层指引与市场共识是否存在差距', '情景概率是否过度依赖单一数据源'],
    watchItems: ['复核最新 SEC / IR 原文', '跟踪下一季收入与 EPS', '复核指引区间与共识差距'],
    missingData: [
      financialFacts.length === 0 ? '缺少财报指标事实。' : '',
      guidanceFacts.length === 0 ? '缺少结构化公司指引事实。' : '',
      scenarioFacts.length === 0 ? '缺少情景推演输入或输出。' : '',
    ],
  });
}

function buildAlphaMemo(input: LLMResearchInput) {
  const qualitativeFacts = findFacts(input, (fact) => fact.kind === 'qualitative_claim');
  const guidanceFacts = findFacts(input, (fact) => fact.kind === 'guidance_metric');
  const topFact = qualitativeFacts[0] ?? guidanceFacts[0];

  return buildSkillCard({
    id: 'serenity_alpha',
    overview: 'Alpha 框架只把已披露文本或指引当作假设线索；暂未接入独立新闻事件时，不输出新闻驱动结论。',
    observations: [
      topFact ? observationFromFact({ fact: topFact, title: '可观察线索', tone: 'watch' }) : null,
    ],
    variables: ['需求变化', '传导路径', '业务纯度', '验证速度'],
    debates: ['当前线索是否来自公司正式披露', '需求变化是否已经进入财务数据', '市场是否把该线索错误归类'],
    watchItems: ['补充新闻/公告事件源', '检查电话会纪要中的需求描述', '跟踪下一季同口径指标'],
    missingData: [
      qualitativeFacts.length === 0 ? '缺少可引用的定性披露文本。' : '',
      '尚未接入独立新闻/舆情事件源，Alpha 判断仅作为财报与指引的二级解读。',
    ],
  });
}

function buildBayesianMemo(input: LLMResearchInput) {
  const growthFacts = findFacts(input, (fact) => (
    fact.kind === 'financial_metric' && /yoy|growth|revenue|eps|income/i.test(fact.label)
  ));
  const guidanceFacts = findFacts(input, (fact) => fact.kind === 'guidance_metric');
  const topGrowth = growthFacts[0];
  const topGuidance = guidanceFacts[0];

  return buildSkillCard({
    id: 'bayesian',
    overview: '贝叶斯估值模块把新增财报与指引证据映射为增长假设的上修、维持或下修线索。',
    observations: [
      topGrowth ? observationFromFact({ fact: topGrowth, title: '增长假设证据', tone: 'watch' }) : null,
      topGuidance ? observationFromFact({ fact: topGuidance, title: '前瞻假设证据', tone: 'watch' }) : null,
    ],
    variables: ['先验增长区间', '收入同比', 'EPS 变化', '指引区间', '市场共识'],
    debates: ['新增证据是否足以改变增长先验', '收入增长与利润增长是否同向', '指引是否只是短期噪声'],
    watchItems: ['补充历史 3-5 年增长序列', '复核同业增长区间', '跟踪分析师预期修正'],
    missingData: [
      growthFacts.length === 0 ? '缺少收入、EPS 或利润增长事实。' : '',
      '缺少完整历史分位和同业估值样本，暂不输出精确内在价值判断。',
    ],
  });
}

function buildGfDmaMemo(input: LLMResearchInput) {
  const financialFacts = findFacts(input, (fact) => fact.kind === 'financial_metric');
  const scenarioFacts = findFacts(input, (fact) => fact.kind === 'scenario_output' || fact.kind === 'scenario_input');
  const topFinancial = financialFacts.find((fact) => /revenue|eps|income|yoy/i.test(fact.label)) ?? financialFacts[0];
  const topScenario = scenarioFacts[0];

  return buildSkillCard({
    id: 'gf_dma',
    overview: 'GF-DMA 健康指数先以基本面速度和情景假设做定性校验；价格均线数据不足时不输出完整趋势分数。',
    observations: [
      topFinancial ? observationFromFact({ fact: topFinancial, title: '基本面速度线索', tone: 'watch' }) : null,
      topScenario ? observationFromFact({ fact: topScenario, title: '情景压力线索', tone: 'neutral' }) : null,
    ],
    variables: ['基本面速度', '预期修正', '价格趋势', '情景概率', '数据新鲜度'],
    debates: ['基本面速度是否能解释价格趋势', '预期修正是否已经被计入', '情景模型是否依赖占位输入'],
    watchItems: ['补充 20/50/100/200 DMA 数据', '跟踪下一次财报修正', '检查价格与基本面速度是否背离'],
    missingData: [
      '缺少完整均线和价格序列，GF-DMA 暂不输出严格量化健康分。',
      financialFacts.length === 0 ? '缺少可用于基本面速度的财务事实。' : '',
    ],
  });
}

function buildTamPegMemo(input: LLMResearchInput) {
  const valuationFacts = findFacts(input, (fact) => fact.kind === 'valuation_metric');
  const financialFacts = findFacts(input, (fact) => (
    fact.kind === 'financial_metric' && /revenue|eps|yoy|growth/i.test(fact.label)
  ));
  const topValuation = valuationFacts[0];
  const topGrowth = financialFacts[0];

  return buildSkillCard({
    id: 'tam_adj_peg',
    overview: 'TAM-Adj-PEG 把估值倍数、增长速度和市场空间放在同一框架；缺少 TAM 时只保留增长/估值线索。',
    observations: [
      topValuation ? observationFromFact({ fact: topValuation, title: '估值倍数线索', tone: 'neutral' }) : null,
      topGrowth ? observationFromFact({ fact: topGrowth, title: '增长速度线索', tone: 'watch' }) : null,
    ],
    variables: ['Forward P/E', 'EPS CAGR', '收入 CAGR', 'TAM runway', '质量因子'],
    debates: ['估值倍数是否已经反映增长 runway', '增长质量是否足以支撑高倍数', 'TAM 是否有可靠来源'],
    watchItems: ['补充 TAM 或渗透率证据', '复核 forward P/E 来源', '跟踪增长率是否持续'],
    missingData: [
      valuationFacts.length === 0 ? '缺少估值倍数事实。' : '',
      '缺少可引用的 TAM / 市场空间证据，暂不计算完整 TAM-Adj-PEG。',
    ],
  });
}

export function buildFallbackSerenityMemo({
  input,
  provider = 'fallback',
  model,
  reason,
}: {
  input: LLMResearchInput;
  provider?: ResearchBriefProvider;
  model?: string;
  reason?: string;
}): SerenityMemo {
  const skillCards = [
    buildBuySideMemo(input),
    buildAlphaMemo(input),
    buildBayesianMemo(input),
    buildGfDmaMemo(input),
    buildTamPegMemo(input),
  ];
  const evidenceRefs = unique(skillCards.flatMap((card) => card.evidenceIds));
  const calculationRefs = unique(skillCards.flatMap((card) => card.calculationRefs));
  const warnings = [
    reason,
    ...input.dataQuality.warnings,
    evidenceRefs.length === 0 ? 'Serenity memo 没有可由证据支持的观察项。' : undefined,
  ].filter((item): item is string => Boolean(item));
  const ticker = input.ticker ?? '公司';

  return {
    version: 'v0.3.4',
    ticker: input.ticker,
    generatedAt: new Date().toISOString(),
    provider,
    model,
    generationMode: 'deterministic-fallback',
    status: provider === 'disabled' ? 'disabled' : 'fallback',
    headline: `${ticker} Serenity Skill Memo`,
    executiveSummary: `本 memo 基于统一 facts/evidence 层生成；当前数据覆盖度为 ${input.dataQuality.coverage}，质量分 ${input.dataQuality.score}/10。`,
    skillCards,
    crossSkillTensions: [
      '财报事实、公司指引、估值和情景推演需要放在同一证据链中交叉验证。',
      input.dataQuality.sourceDiversity.length <= 1 ? '当前数据源多样性有限，跨技能结论需要额外来源复核。' : '',
    ].filter(Boolean),
    watchItems: unique(skillCards.flatMap((card) => card.watchItems)).slice(0, 8),
    dataLimitations: unique([
      ...skillCards.flatMap((card) => card.missingData),
      ...input.dataQuality.warnings,
    ]).slice(0, 8),
    evidenceRefs,
    calculationRefs,
    warnings,
  };
}
