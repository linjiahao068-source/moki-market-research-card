import type { ResearchReport } from '@/types/research-report';

const SECTION_ORDER = [
  'executive_summary',
  'earnings_guidance',
  'scenario_map',
  'evidence_references',
  'technical_context',
  'follow_up_research',
  'disclaimer',
] as const;

function compactString(value: unknown, maxLength = 240) {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}...`;
}

function compactReport(report: ResearchReport) {
  return {
    schemaVersion: report.schemaVersion,
    ticker: report.entity.ticker,
    companyName: report.entity.companyName,
    generatedAt: report.generatedAt,
    executiveSummary: report.executiveSummary,
    sourceIngestionState: {
      status: report.sourceIngestionState.status,
      method: report.sourceIngestionState.method,
      coverage: report.sourceIngestionState.coverage,
      freshness: report.sourceIngestionState.freshness,
      sourceSummary: report.sourceIngestionState.sourceSummary.slice(0, 8),
      recordCount: report.sourceIngestionState.records.length,
      chunkCount: report.sourceIngestionState.chunks.length,
      records: report.sourceIngestionState.records.slice(0, 8).map((record) => ({
        sourceId: record.sourceId,
        title: compactString(record.title, 120),
        sourceLabel: record.sourceLabel,
        sourceType: record.sourceType,
        status: record.status,
        evidenceIds: record.evidenceIds.slice(0, 5),
        factIds: record.factIds.slice(0, 5),
      })),
      chunks: report.sourceIngestionState.chunks.slice(0, 12).map((chunk) => ({
        id: chunk.id,
        evidenceId: chunk.evidenceId,
        sourceLabel: chunk.sourceLabel,
        sourceType: chunk.sourceType,
        text: compactString(chunk.text, 260),
      })),
    },
    allowedSectionIds: SECTION_ORDER,
    evidenceReferences: report.evidenceReferences.slice(0, 12).map((reference) => ({
      id: reference.id,
      title: compactString(reference.title, 120),
      sourceLabel: reference.sourceLabel,
      sourceType: reference.sourceType,
      snippet: compactString(reference.snippet, 220),
    })),
    factReferences: report.factReferences.slice(0, 16).map((fact) => ({
      id: fact.id,
      kind: fact.kind,
      label: fact.label,
      value: compactString(fact.value, 160),
      unit: fact.unit,
      periodLabel: fact.periodLabel,
      source: fact.source,
      evidenceIds: fact.evidenceIds.slice(0, 4),
    })),
    seedSections: report.sections.map((section) => ({
      id: section.id,
      title: section.title,
      summary: compactString(section.summary, 220),
      claims: section.claims.slice(0, 3).map((claim) => ({
        title: compactString(claim.title, 80),
        body: compactString(claim.body, 220),
        tone: claim.tone,
        evidenceIds: claim.evidenceIds.slice(0, 4),
        factIds: claim.factIds.slice(0, 4),
      })),
      metrics: section.metrics.slice(0, 4).map((metric) => ({
        label: compactString(metric.label, 80),
        value: compactString(metric.value, 160),
        whyItMatters: compactString(metric.whyItMatters, 180),
        evidenceIds: metric.evidenceIds.slice(0, 4),
        factIds: metric.factIds.slice(0, 4),
      })),
      missingData: section.missingData.slice(0, 4).map((item) => compactString(item, 140)),
    })),
    followUpResearch: report.followUpResearch.slice(0, 6).map((item) => ({
      task: compactString(item.task, 140),
      whyItMatters: compactString(item.whyItMatters, 180),
      followUpDate: item.followUpDate,
      evidenceIds: item.evidenceIds.slice(0, 4),
      factIds: item.factIds.slice(0, 4),
    })),
  };
}

export function buildResearchReportSystemPrompt() {
  return [
    'You are Moki Market ResearchReport Generator.',
    'Return one valid JSON object for a Simplified Chinese buy-side research report draft.',
    'Use only the provided seed report, facts, and evidence references.',
    'Do not invent numbers, dates, filings, sources, target prices, ratings, probabilities, or trading instructions.',
    'Do not output confidence, data quality score, buy/sell/hold labels, stop loss, position sizing, win rate, or personal investment advice.',
    'Every claim or metric that uses evidence must use evidenceIds and factIds from the provided payload only.',
    'If evidence is missing, put the issue into missingData or followUpResearch instead of fabricating.',
    'Return JSON only. No markdown, no explanations outside JSON.',
  ].join('\n');
}

export function buildResearchReportUserPrompt(seedReport: ResearchReport) {
  const payload = compactReport(seedReport);

  return [
    'Generate a ResearchReport JSON payload with these top-level keys:',
    'title, subtitle, executiveSummary, sections, followUpResearch, disclaimer.',
    '',
    'executiveSummary must include: oneLine, currentState, keyQuestion, optional bullCase, optional bearCase.',
    'sections must include every allowed section id exactly once, in this order:',
    SECTION_ORDER.join(', '),
    'Each section must include: id, title, summary, claims, metrics, items, missingData, evidenceIds, factIds.',
    'claims: {title, body, tone, evidenceIds, factIds}.',
    'metrics: {label, value, description, whyItMatters, evidenceIds, factIds}.',
    'items: {title, body, evidenceIds, factIds}.',
    'followUpResearch: {task, whyItMatters, followUpDate, evidenceIds, factIds}.',
    '',
    'Rules:',
    '- Use polished Simplified Chinese for user-facing fields.',
    '- Keep tickers, EPS, SEC, Yahoo, FMP, and evidenceIds in English when needed.',
    '- Treat sourceIngestionState.records and chunks as the source coverage map; cite only their evidenceIds/factIds.',
    '- Keep technical analysis as market-behavior observation only.',
    '- Prefer clear missingData over unsupported conclusions.',
    '',
    'Payload:',
    JSON.stringify(payload),
  ].join('\n');
}
