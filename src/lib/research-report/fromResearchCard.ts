import type { EvidenceRecord, FactQuality, FactRecord } from '@/types/evidence';
import type { Evidence, ResearchCard } from '@/types/research-card';
import { RESEARCH_REPORT_SCHEMA_VERSION } from '@/types/research-report';
import type {
  ResearchReport,
  ResearchReportClaim,
  ResearchReportEvidenceReference,
  ResearchReportFactReference,
  ResearchReportFollowUpTask,
  ResearchReportMetric,
  ResearchReportSection,
  ResearchReportSectionId,
  ResearchReportStatus,
  ResearchReportTone,
  SourceIngestionStatus,
} from '@/types/research-report';

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function unique(items: Array<string | undefined>) {
  return Array.from(new Set(items.filter(Boolean))) as string[];
}

function qualityFromLegacyConfidence(confidence: number): FactQuality | 'unknown' {
  if (confidence >= 0.75) {
    return 'verified';
  }

  if (confidence >= 0.55) {
    return 'derived';
  }

  return 'fallback';
}

function isEvidenceRecord(item: EvidenceRecord | Evidence): item is EvidenceRecord {
  return 'source' in item;
}

function evidenceWeight(sourceType: string, index: number): ResearchReportEvidenceReference['evidenceWeight'] {
  const normalized = sourceType.toLowerCase();

  if (normalized.includes('fallback') || normalized.includes('mock') || normalized.includes('checklist')) {
    return 'fallback';
  }

  if (index === 0) {
    return 'primary';
  }

  return index < 3 ? 'supporting' : 'context';
}

function mapEvidenceReference(item: EvidenceRecord | Evidence, index: number): ResearchReportEvidenceReference {
  if (isEvidenceRecord(item)) {
    return {
      id: item.id,
      title: item.sourceLabel ?? item.source,
      sourceLabel: item.sourceLabel ?? item.source,
      sourceType: item.sourceType,
      sourceUrl: item.sourceUrl,
      publishedAt: item.publishedAt,
      fetchedAt: item.fetchedAt,
      snippet: item.snippet,
      sourceQuality: item.extracted ? 'extracted' : item.sourceType === 'fallback' ? 'fallback' : 'unknown',
      evidenceWeight: evidenceWeight(item.sourceType, index),
      warnings: item.warnings,
    };
  }

  return {
    id: item.id,
    title: item.sourceLabel,
    sourceLabel: item.sourceLabel,
    sourceType: item.sourceType,
    publishedAt: item.timestamp,
    snippet: item.summary,
    sourceQuality: qualityFromLegacyConfidence(item.confidence),
    evidenceWeight: evidenceWeight(item.sourceType, index),
    warnings: [],
  };
}

function mapFactReference(fact: FactRecord): ResearchReportFactReference {
  return {
    id: fact.id,
    kind: fact.kind,
    label: fact.label,
    value: fact.value,
    numericValue: fact.numericValue,
    unit: fact.unit,
    periodLabel: fact.periodLabel,
    source: fact.source,
    quality: fact.quality,
    evidenceIds: fact.evidenceIds,
    warnings: fact.warnings,
  };
}

function claim(
  sectionId: ResearchReportSectionId,
  title: string,
  body: string,
  tone: ResearchReportTone,
  index: number,
  evidenceIds: string[] = [],
  factIds: string[] = []
): ResearchReportClaim {
  return {
    id: `${sectionId}-${slugPart(title)}-${index + 1}`,
    title,
    body,
    tone,
    factIds,
    evidenceIds,
  };
}

function section(input: {
  id: ResearchReportSectionId;
  title: string;
  summary: string;
  claims?: ResearchReportClaim[];
  metrics?: ResearchReportMetric[];
  items?: ResearchReportSection['items'];
  missingData?: string[];
  evidenceIds?: string[];
  factIds?: string[];
}): ResearchReportSection {
  return {
    id: input.id,
    title: input.title,
    summary: input.summary,
    claims: input.claims ?? [],
    metrics: input.metrics ?? [],
    items: input.items ?? [],
    missingData: input.missingData ?? [],
    evidenceIds: input.evidenceIds ?? [],
    factIds: input.factIds ?? [],
  };
}

function buildSourceIngestionStatus(card: ResearchCard): SourceIngestionStatus {
  if (card.matchStatus === 'unmatched' || card.isMock) {
    return 'fallback';
  }

  if (card.factQuality?.coverage === 'strong') {
    return 'strong';
  }

  if (card.factQuality?.coverage === 'partial' || card.factQuality?.coverage === 'minimal') {
    return 'partial';
  }

  if (card.factQuality?.coverage === 'empty') {
    return 'not_started';
  }

  return 'partial';
}

function buildReportStatus(card: ResearchCard): ResearchReportStatus {
  if (card.matchStatus === 'unmatched' || card.isMock) {
    return 'fallback';
  }

  return card.isSnapshot ? 'snapshot' : 'generated';
}

function buildMetrics(card: ResearchCard, facts: ResearchReportFactReference[]): ResearchReportMetric[] {
  return card.fundamentals.keyMetrics.map((metric, index) => {
    const relatedFacts = facts
      .filter((fact) => fact.label.toLowerCase().includes(metric.label.toLowerCase()))
      .map((fact) => fact.id);

    return {
      id: `metric-${slugPart(metric.label)}-${index + 1}`,
      label: metric.label,
      value: metric.description,
      whyItMatters: metric.whyItMatters,
      factIds: relatedFacts,
      evidenceIds: [],
    };
  });
}

function buildSourceSummary(card: ResearchCard) {
  return unique([
    card.dataQuality?.sourceSummary,
    ...(card.factQuality?.sourceDiversity ?? []),
    card.sourceNote,
  ]);
}

export function buildResearchReportFromCard(card: ResearchCard): ResearchReport {
  const evidenceSource: Array<EvidenceRecord | Evidence> = card.researchEvidence?.length
    ? card.researchEvidence
    : card.evidence;
  const evidenceReferences = evidenceSource.map((item, index) => mapEvidenceReference(item, index));
  const factReferences = (card.facts ?? []).map(mapFactReference);
  const allEvidenceIds = evidenceReferences.map((item) => item.id);
  const allFactIds = factReferences.map((item) => item.id);
  const generatedAt = card.generatedAt ?? card.updatedAt;
  const sourceWarnings = unique([
    ...(card.factQuality?.warnings ?? []),
    ...(card.dataQuality?.warnings ?? []),
    ...(card.enhancedEarnings?.warnings ?? []),
    ...(card.guidanceData?.warnings ?? []),
  ]);

  const followUpResearch: ResearchReportFollowUpTask[] = card.nextSteps.map((step, index) => ({
    id: `follow-up-${index + 1}`,
    task: step.task,
    whyItMatters: step.whyItMatters,
    followUpDate: step.followUpDate,
    evidenceIds: [],
    factIds: [],
  }));

  const sections: ResearchReportSection[] = [
    section({
      id: 'executive_summary',
      title: 'Executive Summary',
      summary: card.summary.oneLine,
      claims: [
        claim('executive_summary', 'Current state', card.summary.currentState, 'neutral', 0, allEvidenceIds.slice(0, 2), allFactIds.slice(0, 3)),
        claim('executive_summary', 'Key question', card.summary.keyQuestion, 'watch', 1, allEvidenceIds.slice(0, 2), allFactIds.slice(0, 3)),
        ...(card.summary.bullCase ? [claim('executive_summary', 'Bull case', card.summary.bullCase, 'positive', 2)] : []),
        ...(card.summary.bearCase ? [claim('executive_summary', 'Bear case', card.summary.bearCase, 'cautious', 3)] : []),
      ],
      evidenceIds: allEvidenceIds.slice(0, 4),
      factIds: allFactIds.slice(0, 6),
    }),
    section({
      id: 'earnings_guidance',
      title: 'Earnings & Guidance',
      summary: card.fundamentals.businessModel,
      metrics: buildMetrics(card, factReferences),
      missingData: sourceWarnings,
      evidenceIds: allEvidenceIds,
      factIds: allFactIds,
    }),
    section({
      id: 'scenario_map',
      title: 'Scenario Map',
      summary: card.advancedScenarios?.sourceNote ?? card.summary.keyQuestion,
      claims: [
        ...(card.summary.bullCase ? [claim('scenario_map', 'Bull setup', card.summary.bullCase, 'positive', 0)] : []),
        ...(card.summary.bearCase ? [claim('scenario_map', 'Bear setup', card.summary.bearCase, 'negative', 1)] : []),
      ],
      items: (card.keySignals ?? card.fundamentals.revenueDrivers).map((signal, index) => ({
        id: `scenario-signal-${index + 1}`,
        title: signal,
        body: 'Track as an auditable variable for later scenario work.',
        evidenceIds: [],
        factIds: [],
      })),
    }),
    section({
      id: 'evidence_references',
      title: 'Evidence References',
      summary: `${evidenceReferences.length} evidence references are attached to this report foundation.`,
      items: evidenceReferences.map((evidence) => ({
        id: `evidence-item-${evidence.id}`,
        title: evidence.title,
        body: evidence.snippet ?? evidence.sourceLabel,
        evidenceIds: [evidence.id],
        factIds: [],
      })),
      evidenceIds: allEvidenceIds,
    }),
    section({
      id: 'technical_context',
      title: 'Technical Context',
      summary: card.technicalContext.note,
      claims: [
        claim('technical_context', 'Price action', card.technicalContext.priceAction, 'neutral', 0),
        claim('technical_context', 'Volume', card.technicalContext.volume, 'neutral', 1),
        claim('technical_context', 'Options IV', card.technicalContext.optionsIv, 'watch', 2),
      ],
    }),
    section({
      id: 'follow_up_research',
      title: 'Follow-up Research',
      summary: 'Follow-up tasks should add sources, verify assumptions, or track metrics; they are not trading actions.',
      items: followUpResearch.map((item) => ({
        id: item.id,
        title: item.task,
        body: item.whyItMatters,
        evidenceIds: item.evidenceIds,
        factIds: item.factIds,
      })),
    }),
    section({
      id: 'disclaimer',
      title: 'Disclaimer',
      summary: card.disclaimer,
    }),
  ];

  return {
    schemaVersion: RESEARCH_REPORT_SCHEMA_VERSION,
    id: `research-report-${card.slug}`,
    slug: card.slug,
    reportType: 'executive-investment-view',
    status: buildReportStatus(card),
    title: card.title,
    subtitle: card.subtitle,
    entity: {
      ticker: card.ticker,
      companyName: card.companyName,
      market: card.market,
      numericCode: card.numericCode,
      chineseName: card.chineseName,
    },
    generatedAt,
    updatedAt: card.updatedAt,
    executiveSummary: card.summary,
    sourceIngestionState: {
      status: buildSourceIngestionStatus(card),
      coverage: card.factQuality?.coverage ?? 'unknown',
      freshness: card.factQuality?.freshness ?? 'unknown',
      sourceSummary: buildSourceSummary(card),
      warnings: sourceWarnings,
    },
    sections,
    evidenceReferences,
    factReferences,
    followUpResearch,
    disclaimer: card.disclaimer,
    legacy: {
      researchCardSlug: card.slug,
      researchCardType: card.cardType,
    },
  };
}
