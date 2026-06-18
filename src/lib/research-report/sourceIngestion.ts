import type {
  DataCoverageLevel,
  DataFreshnessLevel,
  EvidenceRecord,
  FactQuality,
  FactRecord,
} from '@/types/evidence';
import type { Evidence, ResearchCard } from '@/types/research-card';
import type {
  EvidenceWeight,
  ResearchReportEvidenceReference,
  ResearchReportFactReference,
  ResearchReportSourceIngestionState,
  ResearchSourceIngestionMethod,
  ResearchSourceIngestionRecord,
  ResearchSourceIngestionRecordStatus,
  SourceIngestionStatus,
} from '@/types/research-report';
import { createStableId, inferFreshness } from '@/lib/research/factValidation';

export interface ResearchSourceIngestionResult {
  evidenceReferences: ResearchReportEvidenceReference[];
  factReferences: ResearchReportFactReference[];
  sourceIngestionState: ResearchReportSourceIngestionState;
}

function unique(items: Array<string | undefined>) {
  return Array.from(new Set(items.filter(Boolean))) as string[];
}

function isEvidenceRecord(item: EvidenceRecord | Evidence): item is EvidenceRecord {
  return 'source' in item;
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

function evidenceWeight(sourceType: string, index: number): EvidenceWeight {
  const normalized = sourceType.toLowerCase();

  if (normalized.includes('fallback') || normalized.includes('mock') || normalized.includes('checklist')) {
    return 'fallback';
  }

  if (index === 0) {
    return 'primary';
  }

  return index < 3 ? 'supporting' : 'context';
}

function evidenceSnippet(item: EvidenceRecord | Evidence) {
  return isEvidenceRecord(item) ? item.snippet : item.summary;
}

function evidenceSourceLabel(item: EvidenceRecord | Evidence) {
  if (isEvidenceRecord(item)) {
    return item.sourceLabel ?? item.source;
  }

  return item.sourceLabel;
}

function evidenceSourceType(item: EvidenceRecord | Evidence) {
  return item.sourceType;
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

function recordStatus(reference: ResearchReportEvidenceReference): ResearchSourceIngestionRecordStatus {
  if (reference.evidenceWeight === 'fallback' || reference.sourceQuality === 'fallback') {
    return 'fallback';
  }

  if (reference.warnings.length > 0 || !reference.snippet || reference.sourceQuality === 'unknown') {
    return 'partial';
  }

  return 'ingested';
}

function buildIngestionRecord(
  item: EvidenceRecord | Evidence,
  reference: ResearchReportEvidenceReference,
  method: ResearchSourceIngestionMethod,
  factReferences: ResearchReportFactReference[]
): ResearchSourceIngestionRecord {
  const linkedFactIds = factReferences
    .filter((fact) => fact.evidenceIds.includes(reference.id))
    .map((fact) => fact.id);

  return {
    id: createStableId(['source-ingestion', reference.id, method]),
    sourceId: reference.id,
    title: reference.title,
    sourceLabel: evidenceSourceLabel(item),
    sourceType: evidenceSourceType(item),
    method,
    status: recordStatus(reference),
    sourceUrl: isEvidenceRecord(item) ? item.sourceUrl : undefined,
    publishedAt: isEvidenceRecord(item) ? item.publishedAt : item.timestamp,
    fetchedAt: isEvidenceRecord(item) ? item.fetchedAt : undefined,
    snippet: evidenceSnippet(item),
    evidenceIds: [reference.id],
    factIds: linkedFactIds,
    warnings: reference.warnings,
  };
}

function latestDate(values: Array<string | undefined>) {
  const dated = values
    .map((value) => ({ value, timestamp: value ? Date.parse(value) : NaN }))
    .filter((item): item is { value: string; timestamp: number } => Number.isFinite(item.timestamp));

  if (dated.length === 0) {
    return undefined;
  }

  return dated.sort((a, b) => b.timestamp - a.timestamp)[0].value;
}

function inferCoverage(card: ResearchCard, evidenceCount: number, factCount: number): DataCoverageLevel | 'unknown' {
  if (card.factQuality?.coverage) {
    return card.factQuality.coverage;
  }

  if (evidenceCount === 0 && factCount === 0) {
    return 'empty';
  }

  if (factCount >= 8 && evidenceCount >= 4) {
    return 'strong';
  }

  if (evidenceCount >= 4 || factCount >= 3) {
    return 'partial';
  }

  return 'minimal';
}

function inferStatus(card: ResearchCard, records: ResearchSourceIngestionRecord[], coverage: DataCoverageLevel | 'unknown'): SourceIngestionStatus {
  if (card.matchStatus === 'unmatched' || card.isMock) {
    return 'fallback';
  }

  if (records.length === 0 || coverage === 'empty') {
    return 'not_started';
  }

  if (coverage === 'strong' && records.every((record) => record.status === 'ingested')) {
    return 'strong';
  }

  return 'partial';
}

function inferMethod(card: ResearchCard): ResearchSourceIngestionMethod {
  if (card.matchStatus === 'unmatched' || card.isMock) {
    return 'fallback';
  }

  if ((card.researchEvidence?.length ?? 0) > 0 || (card.facts?.length ?? 0) > 0) {
    return 'research_data_layer';
  }

  return 'legacy_card';
}

function buildWarnings(card: ResearchCard, records: ResearchSourceIngestionRecord[]) {
  return unique([
    ...(card.factQuality?.warnings ?? []),
    ...(card.dataQuality?.warnings ?? []),
    ...(card.enhancedEarnings?.warnings ?? []),
    ...(card.guidanceData?.warnings ?? []),
    ...records.flatMap((record) => record.warnings),
  ]);
}

function buildSourceSummary(card: ResearchCard, records: ResearchSourceIngestionRecord[]) {
  return unique([
    card.dataQuality?.sourceSummary,
    ...(card.factQuality?.sourceDiversity ?? []),
    card.sourceNote,
    ...records.map((record) => record.sourceLabel),
  ]).slice(0, 12);
}

function inferStateFreshness(card: ResearchCard, records: ResearchSourceIngestionRecord[]): DataFreshnessLevel | 'unknown' {
  return card.factQuality?.freshness ?? inferFreshness([
    card.generatedAt,
    card.updatedAt,
    ...records.flatMap((record) => [record.publishedAt, record.fetchedAt]),
  ]);
}

export function ingestResearchSourcesFromCard(card: ResearchCard): ResearchSourceIngestionResult {
  const method = inferMethod(card);
  const evidenceSource: Array<EvidenceRecord | Evidence> = card.researchEvidence?.length
    ? card.researchEvidence
    : card.evidence;
  const evidenceReferences = evidenceSource.map((item, index) => mapEvidenceReference(item, index));
  const factReferences = (card.facts ?? []).map(mapFactReference);
  const records = evidenceSource.map((item, index) => buildIngestionRecord(
    item,
    evidenceReferences[index],
    method,
    factReferences
  ));
  const coverage = inferCoverage(card, evidenceReferences.length, factReferences.length);

  return {
    evidenceReferences,
    factReferences,
    sourceIngestionState: {
      status: inferStatus(card, records, coverage),
      method,
      coverage,
      freshness: inferStateFreshness(card, records),
      lastIngestedAt: latestDate([
        card.generatedAt,
        card.updatedAt,
        ...records.flatMap((record) => [record.fetchedAt, record.publishedAt]),
      ]),
      sourceSummary: buildSourceSummary(card, records),
      warnings: buildWarnings(card, records),
      records,
    },
  };
}
