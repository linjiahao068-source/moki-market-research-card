import type { BasicCompanyData } from '@/types/basic-data';
import type { EarningsMetricComparison, EarningsSnapshotData, GuidanceMetricComparison } from '@/types/earnings';
import type { DataQualityReport, EvidenceRecord, FactRecord, ResearchDataLayer } from '@/types/evidence';
import type { GlobalGuidanceEvidence } from '@/types/global-stock-data';
import type { BullBaseBearScenarioSummary } from '@/types/scenario';
import { EvidenceCollector } from './evidenceStore';
import {
  clampConfidence,
  compactText,
  createStableId,
  inferFreshness,
  inferMetricUnit,
  parseNumericString,
  uniqueById,
} from './factValidation';

interface BuildResearchDataLayerInput {
  ticker?: string;
  basicData?: BasicCompanyData;
  earningsSnapshot?: EarningsSnapshotData;
  scenarios?: BullBaseBearScenarioSummary;
}

function sourceName(source?: string) {
  return source ?? 'unknown';
}

function sourceSet(evidence: EvidenceRecord[]) {
  return Array.from(new Set(evidence.map((record) => record.source).filter(Boolean))).sort();
}

function factId(ticker: string | undefined, kind: string, label: string, period?: string) {
  return createStableId(['fact', ticker, kind, label, period]);
}

function qualityFromMetric(metric: EarningsMetricComparison | GuidanceMetricComparison) {
  if (metric.quality === 'verified' || metric.quality === 'estimated' || metric.quality === 'extracted' || metric.quality === 'missing' || metric.quality === 'fallback') {
    return metric.quality;
  }

  return 'derived';
}

function confidenceFromQuality(quality?: string) {
  if (quality === 'verified') {
    return 0.85;
  }

  if (quality === 'extracted') {
    return 0.72;
  }

  if (quality === 'estimated') {
    return 0.62;
  }

  if (quality === 'fallback') {
    return 0.35;
  }

  if (quality === 'missing') {
    return 0.15;
  }

  return 0.5;
}

function buildBasicEvidence(collector: EvidenceCollector, ticker?: string, basicData?: BasicCompanyData) {
  if (!basicData) {
    return;
  }

  const profileLabel = basicData.profile?.companyName ?? basicData.security.companyName ?? ticker ?? 'Company profile';
  collector.add('basic-profile', {
    ticker,
    source: basicData.provider,
    sourceType: 'company-profile',
    sourceLabel: profileLabel,
    fetchedAt: basicData.fetchedAt,
    snippet: compactText(basicData.profile?.description ?? `${profileLabel} basic company data`),
    confidence: basicData.provider === 'mock' ? 0.35 : 0.72,
    extracted: basicData.provider !== 'mock',
    warnings: basicData.warnings,
  });

  for (const [index, link] of basicData.sourceLinks.entries()) {
    collector.add('basic-link', {
      ticker,
      source: basicData.provider,
      sourceType: link.label.toLowerCase().includes('filing') ? 'company-filing' : 'api',
      sourceLabel: link.label,
      sourceUrl: link.url,
      publishedAt: basicData.latestFiling?.filingDate,
      fetchedAt: basicData.fetchedAt,
      snippet: `${link.label} source link`,
      confidence: basicData.provider === 'mock' ? 0.35 : 0.74,
      extracted: basicData.provider !== 'mock',
      textBlockId: createStableId(['basic-link', ticker, index]),
    });
  }
}

function buildEarningsEvidence(collector: EvidenceCollector, ticker?: string, earningsSnapshot?: EarningsSnapshotData) {
  if (!earningsSnapshot) {
    return;
  }

  collector.add('earnings-snapshot', {
    ticker,
    source: earningsSnapshot.provider,
    sourceType: 'earnings-snapshot',
    sourceLabel: `${earningsSnapshot.symbol} earnings snapshot`,
    fetchedAt: earningsSnapshot.fetchedAt,
    publishedAt: earningsSnapshot.reportDate ?? earningsSnapshot.earningsDate,
    snippet: `${earningsSnapshot.companyName} earnings snapshot from ${earningsSnapshot.provider}`,
    confidence: earningsSnapshot.provider === 'mock' ? 0.35 : 0.72,
    extracted: earningsSnapshot.provider !== 'mock',
    warnings: earningsSnapshot.warnings,
  });

  for (const [index, link] of earningsSnapshot.sourceLinks.entries()) {
    collector.add('earnings-link', {
      ticker,
      source: earningsSnapshot.provider,
      sourceType: 'api',
      sourceLabel: link.label,
      sourceUrl: link.url,
      fetchedAt: earningsSnapshot.fetchedAt,
      publishedAt: earningsSnapshot.reportDate ?? earningsSnapshot.earningsDate,
      snippet: `${link.label} earnings source`,
      confidence: earningsSnapshot.provider === 'mock' ? 0.35 : 0.7,
      extracted: earningsSnapshot.provider !== 'mock',
      textBlockId: createStableId(['earnings-link', ticker, index]),
    });
  }
}

function buildGuidanceEvidence(collector: EvidenceCollector, ticker?: string, items: GlobalGuidanceEvidence[] = []) {
  for (const [index, item] of items.entries()) {
    collector.add('guidance', {
      ticker: ticker ?? item.symbol,
      source: sourceName(item.source),
      sourceType: 'guidance-source',
      sourceLabel: item.title ?? item.documentType ?? item.evidenceType ?? 'Guidance evidence',
      sourceUrl: item.url,
      publishedAt: item.publishedAt,
      snippet: compactText(item.snippet),
      confidence: clampConfidence(item.confidence, item.extracted ? 0.72 : 0.45),
      extracted: item.extracted,
      filingAccession: item.filingAccession,
      documentType: item.documentType,
      textBlockId: item.textBlockId ?? createStableId(['guidance-evidence', ticker, index]),
      warnings: item.warnings ?? [],
    });
  }
}

function buildScenarioEvidence(collector: EvidenceCollector, ticker?: string, scenarios?: BullBaseBearScenarioSummary) {
  if (!scenarios) {
    return;
  }

  collector.add('scenario-model', {
    ticker,
    source: 'scenario-provider',
    sourceType: 'scenario-model',
    sourceLabel: `${ticker ?? scenarios.ticker} bull/base/bear scenario model`,
    fetchedAt: new Date().toISOString(),
    snippet: compactText(scenarios.sourceNote),
    confidence: scenarios.dataStatus === 'placeholder' ? 0.35 : 0.62,
    extracted: false,
    warnings: scenarios.warnings ?? [],
  });
}

function buildBasicFacts(ticker?: string, basicData?: BasicCompanyData, evidenceIds: string[] = []): FactRecord[] {
  if (!basicData) {
    return [
      {
        id: factId(ticker, 'source_state', 'basic data missing'),
        ticker,
        kind: 'source_state',
        label: 'Basic company data',
        value: false,
        unit: 'text',
        quality: 'missing',
        confidence: 0.1,
        evidenceIds: [],
        missingReason: 'Basic company data was not loaded.',
        warnings: [],
      },
    ];
  }

  const facts: FactRecord[] = [
    {
      id: factId(ticker, 'company_profile', 'company name'),
      ticker,
      kind: 'company_profile',
      label: 'Company name',
      value: basicData.profile?.companyName ?? basicData.security.companyName,
      unit: 'text',
      source: basicData.provider,
      quality: basicData.provider === 'mock' ? 'fallback' : 'verified',
      confidence: basicData.provider === 'mock' ? 0.35 : 0.76,
      evidenceIds,
      warnings: [],
    },
    {
      id: factId(ticker, 'source_state', 'basic coverage'),
      ticker,
      kind: 'source_state',
      label: 'Basic data coverage',
      value: basicData.coverageStatus,
      unit: 'text',
      source: basicData.provider,
      quality: basicData.coverageStatus === 'failed' || basicData.coverageStatus === 'empty' ? 'missing' : 'verified',
      confidence: basicData.provider === 'mock' ? 0.35 : 0.68,
      evidenceIds,
      warnings: basicData.warnings,
    },
  ];

  if (basicData.latestFiling) {
    facts.push({
      id: factId(ticker, 'qualitative_claim', 'latest filing', basicData.latestFiling.filingDate),
      ticker,
      kind: 'qualitative_claim',
      label: 'Latest filing',
      value: [basicData.latestFiling.formType, basicData.latestFiling.filingDate].filter(Boolean).join(' / '),
      unit: 'text',
      source: basicData.provider,
      quality: 'verified',
      confidence: 0.72,
      evidenceIds,
      warnings: [],
      metadata: {
        accessionNumber: basicData.latestFiling.accessionNumber,
        fiscalPeriod: basicData.latestFiling.fiscalPeriod,
      },
    });
  }

  for (const [key, value] of Object.entries(basicData.financials ?? {})) {
    if (!value) {
      continue;
    }

    const numericValue = parseNumericString(value);
    facts.push({
      id: factId(ticker, 'financial_metric', key, basicData.financials?.period),
      ticker,
      kind: 'financial_metric',
      label: key,
      value,
      numericValue,
      unit: inferMetricUnit(key, numericValue !== undefined ? 'USD' : 'text'),
      periodLabel: basicData.financials?.period,
      fiscalYear: basicData.financials?.fiscalYear,
      source: basicData.provider,
      quality: basicData.provider === 'mock' ? 'fallback' : 'verified',
      confidence: basicData.provider === 'mock' ? 0.35 : 0.72,
      evidenceIds,
      warnings: [],
    });
  }

  return facts;
}

function buildEarningsMetricFacts(ticker?: string, earningsSnapshot?: EarningsSnapshotData, evidenceIds: string[] = []): FactRecord[] {
  if (!earningsSnapshot) {
    return [];
  }

  const facts: FactRecord[] = [];

  for (const metric of earningsSnapshot.metrics) {
    const label = metric.label || metric.metricKey;
    const base = {
      ticker,
      periodLabel: metric.periodLabel,
      fiscalYear: metric.fiscalYear ?? earningsSnapshot.fiscalYear,
      fiscalQuarter: metric.fiscalQuarter ?? earningsSnapshot.fiscalQuarter,
      warnings: metric.warnings,
    };

    if (metric.actual !== undefined) {
      facts.push({
        ...base,
        id: factId(ticker, 'financial_metric', `${label} actual`, metric.periodLabel),
        kind: 'financial_metric',
        label: `${label} actual`,
        value: metric.actual,
        numericValue: metric.actual,
        unit: metric.metricKey === 'eps' ? 'perShare' : 'USD',
        source: metric.actualSource ?? earningsSnapshot.provider,
        quality: qualityFromMetric(metric),
        confidence: confidenceFromQuality(metric.quality),
        evidenceIds,
      });
    }

    if (metric.estimate !== undefined) {
      facts.push({
        ...base,
        id: factId(ticker, 'financial_metric', `${label} consensus`, metric.periodLabel),
        kind: 'financial_metric',
        label: `${label} consensus`,
        value: metric.estimate,
        numericValue: metric.estimate,
        unit: metric.metricKey === 'eps' ? 'perShare' : 'USD',
        source: metric.estimateSource ?? earningsSnapshot.provider,
        quality: 'estimated',
        confidence: 0.58,
        evidenceIds,
      });
    }

    if (metric.yoyPct !== undefined) {
      facts.push({
        ...base,
        id: factId(ticker, 'financial_metric', `${label} YoY`, metric.periodLabel),
        kind: 'financial_metric',
        label: `${label} YoY`,
        value: metric.yoyPct,
        numericValue: metric.yoyPct,
        unit: 'percent',
        source: earningsSnapshot.provider,
        quality: 'derived',
        confidence: 0.62,
        evidenceIds,
      });
    }
  }

  return facts;
}

function guidanceRangeValue(metric: GuidanceMetricComparison) {
  if (metric.guidanceLow !== undefined && metric.guidanceHigh !== undefined) {
    return `${metric.guidanceLow} - ${metric.guidanceHigh}`;
  }

  return metric.guidanceMid;
}

function buildGuidanceFacts(
  ticker?: string,
  earningsSnapshot?: EarningsSnapshotData,
  evidence: EvidenceRecord[] = []
): FactRecord[] {
  if (!earningsSnapshot) {
    return [];
  }

  const facts: FactRecord[] = [];

  for (const metric of earningsSnapshot.guidance) {
    const evidenceIds = [
      ...evidence.filter((item) => item.sourceUrl && item.sourceUrl === metric.sourceUrl).map((item) => item.id),
      ...evidence.filter((item) => item.sourceType === 'guidance-source' && item.ticker === ticker).map((item) => item.id).slice(0, 1),
    ];

    facts.push({
      id: factId(ticker, 'guidance_metric', metric.metricKey, metric.periodLabel),
      ticker,
      kind: 'guidance_metric',
      label: metric.label,
      value: guidanceRangeValue(metric),
      numericValue: metric.guidanceMid,
      unit: metric.metricKey.toLowerCase().includes('eps') ? 'perShare' : 'USD',
      periodLabel: metric.periodLabel,
      source: metric.source ?? sourceName(earningsSnapshot.provider),
      quality: qualityFromMetric(metric),
      confidence: confidenceFromQuality(metric.quality),
      evidenceIds: uniqueById(evidenceIds.map((id) => ({ id }))).map((item) => item.id),
      warnings: metric.warnings,
      metadata: {
        low: metric.guidanceLow,
        mid: metric.guidanceMid,
        high: metric.guidanceHigh,
        consensus: metric.consensus,
      },
    });
  }

  for (const item of earningsSnapshot.guidanceEvidence ?? []) {
    if (!item.snippet) {
      continue;
    }

    const evidenceIds = evidence
      .filter((record) => record.textBlockId === item.textBlockId || record.sourceUrl === item.url)
      .map((record) => record.id);

    facts.push({
      id: factId(ticker, 'qualitative_claim', item.title ?? item.documentType ?? 'guidance evidence', item.publishedAt),
      ticker,
      kind: 'qualitative_claim',
      label: item.title ?? 'Guidance evidence',
      value: compactText(item.snippet, 260),
      unit: 'text',
      periodLabel: item.publishedAt,
      source: sourceName(item.source),
      quality: item.extracted ? 'extracted' : 'estimated',
      confidence: clampConfidence(item.confidence, item.extracted ? 0.7 : 0.45),
      evidenceIds,
      warnings: item.warnings ?? [],
      metadata: {
        documentType: item.documentType,
        filingAccession: item.filingAccession,
      },
    });
  }

  return facts;
}

function buildScenarioFacts(ticker?: string, scenarios?: BullBaseBearScenarioSummary, evidenceIds: string[] = []): FactRecord[] {
  if (!scenarios) {
    return [];
  }

  const facts: FactRecord[] = [];

  if (scenarios.currentPrice !== undefined) {
    facts.push({
      id: factId(ticker, 'scenario_input', 'current price'),
      ticker,
      kind: 'scenario_input',
      label: 'Current price',
      value: scenarios.currentPrice,
      numericValue: scenarios.currentPrice,
      unit: 'USD',
      source: 'scenario-provider',
      quality: scenarios.dataStatus === 'placeholder' ? 'fallback' : 'derived',
      confidence: scenarios.dataStatus === 'placeholder' ? 0.35 : 0.62,
      evidenceIds,
      warnings: [],
    });
  }

  for (const scenario of scenarios.scenarios) {
    facts.push({
      id: factId(ticker, 'scenario_output', `${scenario.case} probability`),
      ticker,
      kind: 'scenario_output',
      label: `${scenario.label} probability`,
      value: scenario.probability,
      numericValue: scenario.probability,
      unit: 'ratio',
      source: scenario.source,
      quality: scenario.source === 'mock' ? 'fallback' : 'derived',
      confidence: scenario.source === 'mock' ? 0.35 : 0.58,
      evidenceIds,
      warnings: [],
      metadata: {
        case: scenario.case,
        targetPrice: scenario.targetPrice,
        impliedReturnPct: scenario.impliedReturnPct,
      },
    });
  }

  return facts;
}

function missingFactWarnings(facts: FactRecord[]) {
  return facts
    .filter((fact) => fact.quality === 'missing' || fact.missingReason)
    .map((fact) => fact.missingReason ?? `${fact.label} is missing.`);
}

function buildDataQualityReport({
  evidence,
  facts,
  basicData,
  earningsSnapshot,
  scenarios,
}: {
  evidence: EvidenceRecord[];
  facts: FactRecord[];
  basicData?: BasicCompanyData;
  earningsSnapshot?: EarningsSnapshotData;
  scenarios?: BullBaseBearScenarioSummary;
}): DataQualityReport {
  const sources = sourceSet(evidence);
  const highConfidenceFacts = facts.filter((fact) => fact.confidence >= 0.6 && fact.quality !== 'missing').length;
  const sourceScore = Math.min(3, sources.length * 1.2);
  const factScore = Math.min(4, highConfidenceFacts * 0.35);
  const evidenceScore = Math.min(2, evidence.length * 0.2);
  const scenarioScore = scenarios && scenarios.dataStatus !== 'placeholder' ? 1 : 0;
  const score = Math.max(0, Math.min(10, Math.round((sourceScore + factScore + evidenceScore + scenarioScore) * 10) / 10));
  const coverage = score >= 7
    ? 'strong'
    : score >= 4
      ? 'partial'
      : score > 0
        ? 'minimal'
        : 'empty';
  const warnings = uniqueById(
    [
      ...(basicData?.warnings ?? []),
      ...(earningsSnapshot?.warnings ?? []),
      ...(scenarios?.warnings ?? []),
      ...missingFactWarnings(facts),
    ].map((warning) => ({ id: warning }))
  ).map((item) => item.id);

  return {
    score,
    coverage,
    freshness: inferFreshness([
      basicData?.fetchedAt,
      basicData?.latestFiling?.filingDate,
      earningsSnapshot?.fetchedAt,
      earningsSnapshot?.reportDate,
      scenarios ? new Date().toISOString() : undefined,
      ...evidence.map((item) => item.publishedAt ?? item.fetchedAt),
    ]),
    sourceDiversity: sources,
    factCount: facts.length,
    evidenceCount: evidence.length,
    generatedAt: new Date().toISOString(),
    warnings: warnings.slice(0, 20),
  };
}

function buildLlmInput(ticker: string | undefined, evidence: EvidenceRecord[], facts: FactRecord[], dataQuality: ResearchDataLayer['dataQuality']) {
  return {
    ticker,
    generatedAt: dataQuality.generatedAt,
    facts: facts.slice(0, 80),
    evidence: evidence.slice(0, 30).map((item) => ({
      id: item.id,
      source: item.source,
      sourceType: item.sourceType,
      sourceUrl: item.sourceUrl,
      publishedAt: item.publishedAt,
      snippet: compactText(item.snippet, 280),
      confidence: item.confidence,
    })),
    dataQuality,
    complianceRules: [
      'Use only provided facts and evidence.',
      'If a fact is missing, state the missing data instead of inventing it.',
      'Every generated claim must include evidenceIds.',
      'Do not produce trading instructions or guaranteed outcomes.',
    ],
  };
}

export function buildResearchDataLayer({
  ticker,
  basicData,
  earningsSnapshot,
  scenarios,
}: BuildResearchDataLayerInput): ResearchDataLayer {
  const resolvedTicker = ticker ?? earningsSnapshot?.symbol ?? basicData?.security.symbol;
  const collector = new EvidenceCollector();

  buildBasicEvidence(collector, resolvedTicker, basicData);
  buildEarningsEvidence(collector, resolvedTicker, earningsSnapshot);
  buildGuidanceEvidence(collector, resolvedTicker, earningsSnapshot?.guidanceEvidence ?? []);
  buildScenarioEvidence(collector, resolvedTicker, scenarios);

  const evidence = collector.list();
  const basicEvidenceIds = evidence
    .filter((record) => record.sourceType === 'company-profile' || record.id.includes('basic-link'))
    .map((record) => record.id);
  const earningsEvidenceIds = evidence
    .filter((record) => record.sourceType === 'earnings-snapshot' || record.id.includes('earnings-link'))
    .map((record) => record.id);
  const scenarioEvidenceIds = evidence
    .filter((record) => record.sourceType === 'scenario-model')
    .map((record) => record.id);
  const facts = uniqueById([
    ...buildBasicFacts(resolvedTicker, basicData, basicEvidenceIds),
    ...buildEarningsMetricFacts(resolvedTicker, earningsSnapshot, earningsEvidenceIds),
    ...buildGuidanceFacts(resolvedTicker, earningsSnapshot, evidence),
    ...buildScenarioFacts(resolvedTicker, scenarios, scenarioEvidenceIds),
  ]);
  const dataQuality = buildDataQualityReport({
    evidence,
    facts,
    basicData,
    earningsSnapshot,
    scenarios,
  });

  return {
    evidence,
    facts,
    dataQuality,
    llmInput: buildLlmInput(resolvedTicker, evidence, facts, dataQuality),
  };
}
