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
  ResearchSourceChunk,
  ResearchSourceIngestionMethod,
  ResearchSourceIngestionRecord,
  ResearchSourceIngestionRecordStatus,
  ResearchSourceInput,
  ResearchSourceInputFact,
  SourceIngestionStatus,
} from '@/types/research-report';
import { compactText, createStableId, inferFreshness } from '@/lib/research/factValidation';

type LegacyEvidenceSource = EvidenceRecord | Evidence;

export interface ResearchSourceIngestionResult {
  evidenceReferences: ResearchReportEvidenceReference[];
  factReferences: ResearchReportFactReference[];
  sourceIngestionState: ResearchReportSourceIngestionState;
}

export interface ResearchSourceInputIngestionInput {
  ticker?: string;
  generatedAt?: string;
  sourceInputs: ResearchSourceInput[];
  facts?: FactRecord[];
  sourceSummary?: string[];
  warnings?: string[];
}

interface ProvidedSourceBundle {
  sourceId: string;
  chunks: ResearchSourceChunk[];
  evidenceReferences: ResearchReportEvidenceReference[];
  factReferences: ResearchReportFactReference[];
  record: ResearchSourceIngestionRecord;
}

function unique(items: Array<string | undefined>) {
  return Array.from(new Set(items.filter(Boolean))) as string[];
}

function isEvidenceRecord(item: LegacyEvidenceSource): item is EvidenceRecord {
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

function evidenceWeight(sourceType: string, index: number, chunkIndex = 0): EvidenceWeight {
  const normalized = sourceType.toLowerCase();

  if (normalized.includes('fallback') || normalized.includes('mock') || normalized.includes('checklist')) {
    return 'fallback';
  }

  if (index === 0 && chunkIndex === 0) {
    return 'primary';
  }

  return index < 3 ? 'supporting' : 'context';
}

function evidenceSnippet(item: LegacyEvidenceSource) {
  return isEvidenceRecord(item) ? item.snippet : item.summary;
}

function evidenceSourceLabel(item: LegacyEvidenceSource) {
  if (isEvidenceRecord(item)) {
    return item.sourceLabel ?? item.source;
  }

  return item.sourceLabel;
}

function evidenceSourceType(item: LegacyEvidenceSource) {
  return item.sourceType;
}

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.replace(/\s+/g, ' ').trim().length / 4));
}

function normalizeText(value?: string) {
  return value?.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
}

function splitSourceText(text: string, maxLength = 1400, maxChunks = 12) {
  const normalized = normalizeText(text);

  if (!normalized) {
    return [];
  }

  const paragraphs = normalized.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs.length > 0 ? paragraphs : [normalized]) {
    if ((current + '\n\n' + paragraph).trim().length <= maxLength) {
      current = [current, paragraph].filter(Boolean).join('\n\n');
      continue;
    }

    if (current) {
      chunks.push(current);
      current = '';
    }

    if (paragraph.length <= maxLength) {
      current = paragraph;
      continue;
    }

    for (let start = 0; start < paragraph.length; start += maxLength) {
      chunks.push(paragraph.slice(start, start + maxLength).trim());
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.filter(Boolean).slice(0, maxChunks);
}

function sourceInputSnippets(input: ResearchSourceInput) {
  const snippets = input.snippets
    ?.map(normalizeText)
    .filter((item): item is string => Boolean(item));

  if (snippets && snippets.length > 0) {
    return snippets.slice(0, 12);
  }

  return splitSourceText(input.text ?? '');
}

function sourceInputId(input: ResearchSourceInput, index: number) {
  return createStableId([
    'provided-source',
    input.id,
    input.sourceLabel,
    input.title,
    index + 1,
  ]);
}

function legacyChunk(item: LegacyEvidenceSource, reference: ResearchReportEvidenceReference, index: number): ResearchSourceChunk | null {
  const snippet = evidenceSnippet(item);

  if (!snippet) {
    return null;
  }

  return {
    id: createStableId(['source-chunk', reference.id, index + 1]),
    sourceId: reference.id,
    chunkIndex: 0,
    title: reference.title,
    text: snippet,
    evidenceId: reference.id,
    sourceLabel: reference.sourceLabel,
    sourceType: reference.sourceType,
    sourceUrl: reference.sourceUrl,
    publishedAt: reference.publishedAt,
    fetchedAt: reference.fetchedAt,
    tokenEstimate: estimateTokens(snippet),
    warnings: reference.warnings,
  };
}

function mapEvidenceReference(item: LegacyEvidenceSource, index: number): ResearchReportEvidenceReference {
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

function mapSourceInputFact(
  sourceId: string,
  fact: ResearchSourceInputFact,
  index: number,
  fallbackEvidenceIds: string[]
): ResearchReportFactReference {
  return {
    id: fact.id ?? createStableId(['provided-fact', sourceId, fact.label, index + 1]),
    kind: fact.kind,
    label: fact.label,
    value: fact.value,
    numericValue: fact.numericValue,
    unit: fact.unit,
    periodLabel: fact.periodLabel,
    source: fact.source ?? sourceId,
    quality: fact.quality ?? 'extracted',
    evidenceIds: fact.evidenceIds?.length ? fact.evidenceIds : fallbackEvidenceIds.slice(0, 3),
    warnings: fact.warnings ?? [],
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

function sourceInputRecordStatus(input: ResearchSourceInput, chunks: ResearchSourceChunk[], warnings: string[]): ResearchSourceIngestionRecordStatus {
  const normalized = input.sourceType.toLowerCase();

  if (chunks.length === 0) {
    return 'missing';
  }

  if (normalized.includes('fallback') || normalized.includes('mock')) {
    return 'fallback';
  }

  return warnings.length > 0 ? 'partial' : 'ingested';
}

function buildIngestionRecord(
  item: LegacyEvidenceSource,
  reference: ResearchReportEvidenceReference,
  method: ResearchSourceIngestionMethod,
  factReferences: ResearchReportFactReference[],
  chunk?: ResearchSourceChunk | null
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
    chunkIds: chunk ? [chunk.id] : [],
    evidenceIds: [reference.id],
    factIds: linkedFactIds,
    warnings: reference.warnings,
  };
}

function buildProvidedSourceBundle(input: ResearchSourceInput, index: number): ProvidedSourceBundle {
  const sourceId = sourceInputId(input, index);
  const snippets = sourceInputSnippets(input);
  const missingWarnings = snippets.length === 0
    ? [`Source ${input.title} has no text or snippets to ingest.`]
    : [];
  const baseWarnings = unique([...(input.warnings ?? []), ...missingWarnings]);
  const chunks: ResearchSourceChunk[] = snippets.map((snippet, chunkIndex) => {
    const evidenceId = createStableId(['evidence', sourceId, 'chunk', chunkIndex + 1]);

    return {
      id: createStableId(['source-chunk', sourceId, chunkIndex + 1]),
      sourceId,
      chunkIndex,
      title: input.title,
      text: snippet,
      evidenceId,
      sourceLabel: input.sourceLabel,
      sourceType: input.sourceType,
      sourceUrl: input.sourceUrl,
      publishedAt: input.publishedAt,
      fetchedAt: input.fetchedAt,
      tokenEstimate: estimateTokens(snippet),
      warnings: input.warnings ?? [],
    };
  });
  const evidenceReferences: ResearchReportEvidenceReference[] = chunks.map((chunk, chunkIndex) => ({
    id: chunk.evidenceId,
    title: `${input.title} #${chunkIndex + 1}`,
    sourceLabel: input.sourceLabel,
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl,
    publishedAt: input.publishedAt,
    fetchedAt: input.fetchedAt,
    snippet: compactText(chunk.text, 520),
    sourceQuality: input.sourceType.toLowerCase().includes('fallback') ? 'fallback' : 'extracted',
    evidenceWeight: evidenceWeight(input.sourceType, index, chunkIndex),
    warnings: chunk.warnings,
  }));
  const evidenceIds = evidenceReferences.map((item) => item.id);
  const factReferences = (input.facts ?? []).map((fact, factIndex) => mapSourceInputFact(
    sourceId,
    fact,
    factIndex,
    evidenceIds
  ));
  const record: ResearchSourceIngestionRecord = {
    id: createStableId(['source-ingestion', sourceId, 'provided-source']),
    sourceId,
    title: input.title,
    sourceLabel: input.sourceLabel,
    sourceType: input.sourceType,
    method: 'provided_source',
    status: sourceInputRecordStatus(input, chunks, baseWarnings),
    sourceUrl: input.sourceUrl,
    publishedAt: input.publishedAt,
    fetchedAt: input.fetchedAt,
    snippet: compactText(chunks[0]?.text, 520),
    chunkIds: chunks.map((chunk) => chunk.id),
    evidenceIds,
    factIds: factReferences.map((fact) => fact.id),
    warnings: baseWarnings,
  };

  return {
    sourceId,
    chunks,
    evidenceReferences,
    factReferences,
    record,
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

function coverageFromCounts(evidenceCount: number, factCount: number): DataCoverageLevel | 'unknown' {
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

function inferCoverage(card: ResearchCard, evidenceCount: number, factCount: number): DataCoverageLevel | 'unknown' {
  return card.factQuality?.coverage ?? coverageFromCounts(evidenceCount, factCount);
}

function statusFromRecords(
  records: ResearchSourceIngestionRecord[],
  coverage: DataCoverageLevel | 'unknown',
  fallback: boolean
): SourceIngestionStatus {
  if (fallback) {
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

function inferStatus(card: ResearchCard, records: ResearchSourceIngestionRecord[], coverage: DataCoverageLevel | 'unknown'): SourceIngestionStatus {
  return statusFromRecords(records, coverage, card.matchStatus === 'unmatched' || card.isMock);
}

function inferMethod(card: ResearchCard): ResearchSourceIngestionMethod {
  if ((card.sourceInputs?.length ?? 0) > 0) {
    return 'provided_source';
  }

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

export function ingestResearchSourceInputs(input: ResearchSourceInputIngestionInput): ResearchSourceIngestionResult {
  const bundles = input.sourceInputs.map((source, index) => buildProvidedSourceBundle(source, index));
  const chunks = bundles.flatMap((bundle) => bundle.chunks);
  const evidenceReferences = bundles.flatMap((bundle) => bundle.evidenceReferences);
  const providedFactReferences = bundles.flatMap((bundle) => bundle.factReferences);
  const factReferences = [
    ...(input.facts ?? []).map(mapFactReference),
    ...providedFactReferences,
  ];
  const records = bundles.map((bundle) => bundle.record);
  const coverage = coverageFromCounts(evidenceReferences.length, factReferences.length);
  const status = statusFromRecords(records, coverage, false);
  const dates = [
    input.generatedAt,
    ...records.flatMap((record) => [record.fetchedAt, record.publishedAt]),
  ];

  return {
    evidenceReferences,
    factReferences,
    sourceIngestionState: {
      status,
      method: 'provided_source',
      coverage,
      freshness: inferFreshness(dates),
      lastIngestedAt: latestDate(dates),
      sourceSummary: unique([
        ...(input.sourceSummary ?? []),
        ...records.map((record) => record.sourceLabel),
      ]).slice(0, 12),
      warnings: unique([
        ...(input.warnings ?? []),
        ...records.flatMap((record) => record.warnings),
      ]),
      chunks,
      records,
    },
  };
}

export function ingestResearchSourcesFromCard(card: ResearchCard): ResearchSourceIngestionResult {
  if ((card.sourceInputs?.length ?? 0) > 0) {
    const generatedAt = card.generatedAt ?? card.updatedAt;

    return ingestResearchSourceInputs({
      ticker: card.ticker,
      generatedAt,
      sourceInputs: card.sourceInputs ?? [],
      facts: card.facts,
      sourceSummary: unique([
        card.dataQuality?.sourceSummary,
        ...(card.factQuality?.sourceDiversity ?? []),
        card.sourceNote,
      ]),
      warnings: unique([
        ...(card.factQuality?.warnings ?? []),
        ...(card.dataQuality?.warnings ?? []),
        ...(card.enhancedEarnings?.warnings ?? []),
        ...(card.guidanceData?.warnings ?? []),
      ]),
    });
  }

  const method = inferMethod(card);
  const evidenceSource: LegacyEvidenceSource[] = card.researchEvidence?.length
    ? card.researchEvidence
    : card.evidence;
  const evidenceReferences = evidenceSource.map((item, index) => mapEvidenceReference(item, index));
  const factReferences = (card.facts ?? []).map(mapFactReference);
  const chunks = evidenceSource
    .map((item, index) => legacyChunk(item, evidenceReferences[index], index))
    .filter((chunk): chunk is ResearchSourceChunk => Boolean(chunk));
  const chunkByEvidenceId = new Map(chunks.map((chunk) => [chunk.evidenceId, chunk]));
  const records = evidenceSource.map((item, index) => buildIngestionRecord(
    item,
    evidenceReferences[index],
    method,
    factReferences,
    chunkByEvidenceId.get(evidenceReferences[index].id)
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
      chunks,
      records,
    },
  };
}
