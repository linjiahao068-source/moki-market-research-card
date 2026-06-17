import type { LLMResearchInput } from '@/types/evidence';
import type { ResearchBrief } from '@/types/research-brief';

const MODULE_SPEC = [
  {
    id: 'earnings_snapshot',
    title: '财报快照',
    focus: 'reported financial facts, consensus gap, year-over-year trend, and quality of the reported data',
  },
  {
    id: 'company_guidance',
    title: '公司指引',
    focus: 'management guidance range, period covered, source text, and gaps against consensus when available',
  },
  {
    id: 'scenario_readthrough',
    title: '买方情景推演',
    focus: 'bull/base/bear scenario implications, valuation assumptions, risk/reward, and missing scenario inputs',
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

function factPriority(kind: string, label: string) {
  if (kind === 'guidance_metric') {
    return 0;
  }

  if (kind === 'financial_metric' && /actual|yoy|consensus/i.test(label)) {
    return 1;
  }

  if (kind === 'scenario_output' || kind === 'scenario_input') {
    return 2;
  }

  if (kind === 'qualitative_claim') {
    return 3;
  }

  return 4;
}

function selectPromptFacts(input: LLMResearchInput) {
  const usableFacts = input.facts
    .filter((fact) => fact.quality !== 'missing')
    .sort((a, b) => b.confidence - a.confidence);
  const selectedFacts = [
    ...usableFacts.filter((fact) => fact.kind === 'financial_metric' && /actual|yoy|consensus/i.test(fact.label)).slice(0, 3),
    ...usableFacts.filter((fact) => fact.kind === 'guidance_metric').slice(0, 2),
    ...usableFacts.filter((fact) => fact.kind === 'scenario_output' || fact.kind === 'scenario_input').slice(0, 3),
    ...usableFacts.filter((fact) => fact.kind === 'qualitative_claim').slice(0, 1),
  ];
  const dedupedFacts = Array.from(new Map(selectedFacts.map((fact) => [fact.id, fact])).values())
    .sort((a, b) => factPriority(a.kind, a.label) - factPriority(b.kind, b.label) || b.confidence - a.confidence)
    .slice(0, 8);

  return dedupedFacts
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

function selectPromptEvidence(input: LLMResearchInput) {
  const referencedEvidenceIds = new Set(selectPromptFacts(input).flatMap((fact) => fact.evidenceIds));

  return input.evidence
    .filter((item) => referencedEvidenceIds.has(item.id))
    .slice(0, 6)
    .map((item) => ({
      ...item,
      snippet: compactString(item.snippet, 180),
    }));
}

function compactSeedBrief(seedBrief: ResearchBrief) {
  return {
    headline: seedBrief.headline,
    executiveSummary: seedBrief.executiveSummary,
    modules: seedBrief.modules.map((module) => ({
      id: module.id,
      title: module.title,
      summary: compactString(module.summary, 180),
      claims: module.claims.slice(0, 2).map((claim) => ({
        title: claim.title,
        body: compactString(claim.body, 220),
        tone: claim.tone,
        confidence: claim.confidence,
        evidenceIds: claim.evidenceIds.slice(0, 4),
      })),
      missingData: module.missingData.slice(0, 2).map((item) => compactString(item, 140)),
    })),
    uncertainties: seedBrief.uncertainties.slice(0, 4).map((item) => compactString(item, 140)),
    evidenceRefs: seedBrief.evidenceRefs.slice(0, 8),
  };
}

export function buildResearchBriefSystemPrompt() {
  return [
    'You are Moki Market Research Brief Generator.',
    'You must produce concise Simplified Chinese equity-research output for a web information card.',
    'All user-facing fields must be Simplified Chinese: headline, executiveSummary, module titles, module summaries, claim titles, claim bodies, missingData, and uncertainties.',
    'Keep only tickers, evidenceIds, metric abbreviations such as EPS, and source names such as SEC/Yahoo/FMP in English when necessary.',
    'Do not use English headings such as "Earnings & Guidance Brief", "Research Brief", "reported fact", "management guidance", or "scenario output".',
    'Use only the facts and evidence in the user payload.',
    'Never invent numbers, dates, sources, filings, guidance, probabilities, or valuation levels.',
    'Every claim must include evidenceIds that exist in the payload evidence list.',
    'If evidence is missing, write it in missingData or uncertainties instead of fabricating a claim.',
    'Do not provide investment advice, trading instructions, price targets as recommendations, or guaranteed outcomes.',
    'Return JSON only. No markdown, no code fences, no explanations outside JSON.',
  ].join('\n');
}

export function buildResearchBriefUserPrompt(input: LLMResearchInput, seedBrief?: ResearchBrief) {
  const facts = selectPromptFacts(input);
  const evidence = selectPromptEvidence(input);
  const seedEvidenceIds = new Set(seedBrief?.evidenceRefs ?? []);
  const compactPayload = {
    ticker: input.ticker,
    generatedAt: input.generatedAt,
    dataQuality: {
      ...input.dataQuality,
      warnings: input.dataQuality.warnings.slice(0, 3).map((warning) => compactString(warning, 140)),
    },
    complianceRules: input.complianceRules,
    modules: MODULE_SPEC,
    seedBrief: seedBrief ? compactSeedBrief(seedBrief) : undefined,
    facts: seedBrief ? undefined : facts,
    evidence: seedBrief
      ? input.evidence
          .filter((item) => seedEvidenceIds.has(item.id))
          .slice(0, 8)
          .map((item) => ({
            ...item,
            snippet: compactString(item.snippet, 180),
          }))
      : evidence,
  };

  return [
    'Generate a ResearchBrief JSON object with keys:',
    'headline, executiveSummary, modules, uncertainties.',
    'modules must be an array of {id,title,summary,claims,missingData}.',
    'claims must be an array of {title,body,tone,confidence,evidenceIds}.',
    '',
    'Rules:',
    '- Generate all three modules, even when some modules only contain missingData.',
    '- Use at most one claim per module.',
    '- Claims without valid evidenceIds are invalid.',
    '- If seedBrief is provided, preserve its evidenceIds and improve wording without adding new facts.',
    '- Rewrite seedBrief wording into polished Simplified Chinese if it contains English phrases.',
    '- Prefer short, specific claims over broad commentary.',
    '- Mention data-quality limitations when source diversity, freshness, or coverage is weak.',
    '',
    'Payload:',
    JSON.stringify(compactPayload),
  ].join('\n');
}
