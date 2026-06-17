import type { LLMResearchInput } from '@/types/evidence';
import type { SerenityMemo } from '@/types/serenity-memo';

const SKILL_SPEC = [
  {
    id: 'buy_side_memo',
    title: '买方研究备忘录',
    focus: 'investment hypothesis, key debates, thesis breakpoints, and evidence-backed watch items',
  },
  {
    id: 'serenity_alpha',
    title: 'Serenity Alpha',
    focus: 'observable demand change, transmission path, market misclassification, and validation metrics',
  },
  {
    id: 'bayesian',
    title: '贝叶斯估值',
    focus: 'prior/posterior growth hypothesis, valuation state, and what evidence shifts assumptions',
  },
  {
    id: 'gf_dma',
    title: 'GF-DMA 健康指数',
    focus: 'fundamental speed, revision confirmation, trend-health limits, and missing market data',
  },
  {
    id: 'tam_adj_peg',
    title: 'TAM-Adj-PEG',
    focus: 'valuation multiple, growth runway, TAM constraints, and quality-factor caveats',
  },
] as const;

function compactString(value: unknown, maxLength = 180) {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
}

function compactSeedMemo(seedMemo: SerenityMemo) {
  return {
    headline: seedMemo.headline,
    executiveSummary: compactString(seedMemo.executiveSummary, 220),
    skillCards: seedMemo.skillCards.map((card) => ({
      id: card.id,
      title: card.title,
      frameworkQuestion: card.frameworkQuestion,
      overview: compactString(card.overview, 220),
      observations: card.observations.slice(0, 2).map((observation) => ({
        title: observation.title,
        body: compactString(observation.body, 240),
        tone: observation.tone,
        confidence: observation.confidence,
        evidenceIds: observation.evidenceIds.slice(0, 4),
        calculationRefs: observation.calculationRefs.slice(0, 4),
      })),
      variables: card.variables.slice(0, 4).map((item) => compactString(item, 120)),
      debates: card.debates.slice(0, 3).map((item) => compactString(item, 140)),
      watchItems: card.watchItems.slice(0, 3).map((item) => compactString(item, 140)),
      missingData: card.missingData.slice(0, 3).map((item) => compactString(item, 140)),
    })),
    crossSkillTensions: seedMemo.crossSkillTensions.slice(0, 4).map((item) => compactString(item, 160)),
    watchItems: seedMemo.watchItems.slice(0, 6).map((item) => compactString(item, 140)),
    dataLimitations: seedMemo.dataLimitations.slice(0, 6).map((item) => compactString(item, 140)),
    evidenceRefs: seedMemo.evidenceRefs.slice(0, 10),
    calculationRefs: seedMemo.calculationRefs.slice(0, 12),
  };
}

function selectFacts(input: LLMResearchInput, seedMemo: SerenityMemo) {
  const referencedFactIds = new Set(seedMemo.calculationRefs);
  const referencedEvidenceIds = new Set(seedMemo.evidenceRefs);
  const selected = [
    ...input.facts.filter((fact) => referencedFactIds.has(fact.id)),
    ...input.facts.filter((fact) => fact.evidenceIds.some((id) => referencedEvidenceIds.has(id))),
  ];

  return Array.from(new Map(selected.map((fact) => [fact.id, fact])).values())
    .slice(0, 14)
    .map((fact) => ({
      id: fact.id,
      kind: fact.kind,
      label: fact.label,
      value: compactString(fact.value, 180),
      numericValue: fact.numericValue,
      unit: fact.unit,
      periodLabel: fact.periodLabel,
      source: fact.source,
      quality: fact.quality,
      confidence: fact.confidence,
      evidenceIds: fact.evidenceIds.slice(0, 4),
    }));
}

function selectEvidence(input: LLMResearchInput, seedMemo: SerenityMemo) {
  const referencedEvidenceIds = new Set(seedMemo.evidenceRefs);

  return input.evidence
    .filter((item) => referencedEvidenceIds.has(item.id))
    .slice(0, 10)
    .map((item) => ({
      ...item,
      snippet: compactString(item.snippet, 180),
    }));
}

export function buildSerenitySkillsSystemPrompt() {
  return [
    'You are Moki Market Serenity Skill Memo Generator.',
    'You produce concise Simplified Chinese, source-backed equity research memo content for a web card.',
    'All user-facing fields must be Simplified Chinese: headline, executiveSummary, skill titles, frameworkQuestion, overview, observation titles/bodies, variables, debates, watchItems, missingData, crossSkillTensions, dataLimitations, and warnings.',
    'Keep tickers, evidenceIds, calculationRefs, EPS, SEC/Yahoo/FMP, TAM-Adj-PEG, GF-DMA, and model names in English when necessary.',
    'Use only facts, evidence, and seedMemo in the payload.',
    'Never invent numbers, dates, filings, market prices, target prices, TAM sizes, probabilities, sources, or guidance ranges.',
    'Every observation must include evidenceIds that exist in payload.evidence and calculationRefs that exist in payload.facts.',
    'If evidence is missing, put the issue in missingData or dataLimitations instead of fabricating an observation.',
    'Do not provide investment advice, trading instructions, buy/sell/hold calls, or guaranteed outcomes.',
    'Return JSON only. No markdown, no code fences, no explanation outside JSON.',
  ].join('\n');
}

export function buildSerenitySkillsUserPrompt(input: LLMResearchInput, seedMemo: SerenityMemo) {
  const compactPayload = {
    ticker: input.ticker,
    generatedAt: input.generatedAt,
    dataQuality: {
      ...input.dataQuality,
      warnings: input.dataQuality.warnings.slice(0, 4).map((warning) => compactString(warning, 160)),
    },
    complianceRules: input.complianceRules,
    skills: SKILL_SPEC,
    seedMemo: compactSeedMemo(seedMemo),
    facts: selectFacts(input, seedMemo),
    evidence: selectEvidence(input, seedMemo),
  };

  return [
    'Generate a SerenityMemo JSON object with keys:',
    'headline, executiveSummary, skillCards, crossSkillTensions, watchItems, dataLimitations.',
    '',
    'skillCards must include exactly these five ids:',
    'buy_side_memo, serenity_alpha, bayesian, gf_dma, tam_adj_peg.',
    '',
    'Each skillCard must be:',
    '{id,title,frameworkQuestion,overview,observations,variables,debates,watchItems,missingData}.',
    'Each observation must be:',
    '{title,body,tone,confidence,evidenceIds,calculationRefs}.',
    '',
    'Rules:',
    '- Rewrite seedMemo into clearer Chinese, but preserve the same evidenceIds and calculationRefs.',
    '- At most two observations per skillCard.',
    '- Do not add observations without valid evidenceIds and calculationRefs.',
    '- If a skill lacks inputs, keep observations empty and explain missing data.',
    '- Prefer compact, decision-useful wording suitable for a web card.',
    '- Mention limitations when source diversity, freshness, TAM, price trend, or historical valuation data is missing.',
    '',
    'Payload:',
    JSON.stringify(compactPayload),
  ].join('\n');
}
