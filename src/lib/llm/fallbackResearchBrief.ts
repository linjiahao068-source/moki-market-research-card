import type { FactRecord, LLMResearchInput } from '@/types/evidence';
import type {
  ResearchBrief,
  ResearchBriefClaim,
  ResearchBriefModule,
  ResearchBriefModuleId,
  ResearchBriefProvider,
  ResearchBriefTone,
} from '@/types/research-brief';

function formatValue(fact: FactRecord) {
  if (fact.value === undefined || fact.value === null || fact.value === '') {
    return 'not available';
  }

  if (typeof fact.value === 'number') {
    if (fact.unit === 'percent') {
      return `${fact.value.toFixed(1)}%`;
    }

    if (fact.unit === 'ratio') {
      return `${(fact.value * 100).toFixed(0)}%`;
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

function claimFromFact({
  fact,
  title,
  tone = 'neutral',
  prefix,
}: {
  fact: FactRecord;
  title?: string;
  tone?: ResearchBriefTone;
  prefix?: string;
}): ResearchBriefClaim | null {
  if (fact.evidenceIds.length === 0) {
    return null;
  }

  const period = fact.periodLabel ? `（${fact.periodLabel}）` : '';
  const bodyPrefix = prefix ? `${prefix}：` : '';

  return {
    id: fact.id,
    title: title ?? fact.label,
    body: `${bodyPrefix}${fact.label}${period}为 ${formatValue(fact)}，来源质量为 ${fact.quality}。`,
    tone,
    confidence: fact.confidence,
    evidenceIds: fact.evidenceIds,
  };
}

function buildModule({
  id,
  title,
  summary,
  claims,
  missingData,
}: {
  id: ResearchBriefModuleId;
  title: string;
  summary: string;
  claims: Array<ResearchBriefClaim | null>;
  missingData: string[];
}): ResearchBriefModule {
  const validClaims = claims.filter((claim): claim is ResearchBriefClaim => Boolean(claim));
  const evidenceIds = Array.from(new Set(validClaims.flatMap((claim) => claim.evidenceIds)));

  return {
    id,
    title,
    summary: validClaims.length > 0 ? summary : '当前证据不足，暂不生成该模块结论。',
    claims: validClaims,
    missingData: validClaims.length > 0 ? missingData : Array.from(new Set([...missingData, '缺少可引用 evidenceIds 的事实。'])),
    evidenceIds,
  };
}

function findFacts(input: LLMResearchInput, predicate: (fact: FactRecord) => boolean) {
  return input.facts
    .filter((fact) => fact.quality !== 'missing')
    .filter(predicate)
    .sort((a, b) => b.confidence - a.confidence);
}

function buildEarningsModule(input: LLMResearchInput) {
  const financialFacts = findFacts(input, (fact) => fact.kind === 'financial_metric');
  const actuals = financialFacts.filter((fact) => /actual/i.test(fact.label)).slice(0, 2);
  const growth = financialFacts.find((fact) => /yoy/i.test(fact.label));
  const consensus = financialFacts.find((fact) => /consensus/i.test(fact.label));

  return buildModule({
    id: 'earnings_snapshot',
    title: '财报快照',
    summary: '财报快照基于已抽取的 reported facts 与共识/同比指标生成，仍需回到原始来源复核。',
    claims: [
      ...actuals.map((fact) => claimFromFact({ fact, prefix: 'reported fact' })),
      growth ? claimFromFact({ fact: growth, title: '同比变化', tone: 'watch' }) : null,
      consensus ? claimFromFact({ fact: consensus, title: '市场共识', tone: 'watch' }) : null,
    ],
    missingData: financialFacts.length === 0 ? ['未找到可用于财报快照的 financial_metric facts。'] : [],
  });
}

function buildGuidanceModule(input: LLMResearchInput) {
  const guidanceFacts = findFacts(input, (fact) => fact.kind === 'guidance_metric');
  const guidanceClaims = guidanceFacts
    .slice(0, 3)
    .map((fact) => claimFromFact({ fact, prefix: 'management guidance', tone: fact.quality === 'extracted' ? 'watch' : 'neutral' }));

  return buildModule({
    id: 'company_guidance',
    title: '公司指引',
    summary: '公司指引模块仅使用已抽取的 management guidance 与 SEC/Yahoo/FMP 等来源证据。',
    claims: guidanceClaims,
    missingData: guidanceFacts.length === 0 ? ['未找到结构化 guidance_metric facts。'] : [],
  });
}

function buildScenarioModule(input: LLMResearchInput) {
  const scenarioFacts = findFacts(input, (fact) => fact.kind === 'scenario_output' || fact.kind === 'scenario_input');
  const scenarioClaims = scenarioFacts
    .filter((fact) => fact.evidenceIds.length > 0)
    .slice(0, 4)
    .map((fact) => {
      const tone: ResearchBriefTone = fact.kind === 'scenario_output' ? 'watch' : 'neutral';
      return claimFromFact({ fact, prefix: 'scenario output', tone });
    });

  return buildModule({
    id: 'scenario_readthrough',
    title: '买方情景推演',
    summary: '情景推演仅解释输入假设与概率输出，不把情景价格当作投资建议。',
    claims: scenarioClaims,
    missingData: scenarioFacts.length === 0
      ? ['未找到 scenario facts。']
      : scenarioClaims.length === 0
        ? ['scenario facts 暂无 evidenceIds，已避免生成不可追溯结论。']
        : [],
  });
}

export function buildFallbackResearchBrief({
  input,
  provider = 'fallback',
  model,
  reason,
}: {
  input: LLMResearchInput;
  provider?: ResearchBriefProvider;
  model?: string;
  reason?: string;
}): ResearchBrief {
  const modules = [
    buildEarningsModule(input),
    buildGuidanceModule(input),
    buildScenarioModule(input),
  ];
  const evidenceRefs = Array.from(new Set(modules.flatMap((module) => module.evidenceIds)));
  const warnings = [
    reason,
    ...input.dataQuality.warnings,
    evidenceRefs.length === 0 ? 'Fallback brief has no evidence-backed claims.' : undefined,
  ].filter((item): item is string => Boolean(item));
  const ticker = input.ticker ?? 'Company';

  return {
    version: 'v0.3.3',
    ticker: input.ticker,
    generatedAt: new Date().toISOString(),
    provider,
    model,
    generationMode: 'deterministic-fallback',
    status: provider === 'disabled' ? 'disabled' : reason ? 'fallback' : 'fallback',
    headline: `${ticker} evidence-backed research brief`,
    executiveSummary: `当前摘要由 facts/evidence deterministic fallback 生成；数据覆盖度为 ${input.dataQuality.coverage}，质量分 ${input.dataQuality.score}/10。`,
    modules,
    uncertainties: [
      ...input.dataQuality.warnings.slice(0, 4),
      input.dataQuality.sourceDiversity.length <= 1 ? '数据源多样性有限，需要补充更多独立来源。' : '',
    ].filter(Boolean),
    evidenceRefs,
    warnings,
  };
}
