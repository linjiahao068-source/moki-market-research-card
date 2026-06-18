import type {
  IntegratedReportPillar,
  IntegratedReportPillarId,
  IntegratedReportPillarStatus,
  IntegratedReportPriority,
  IntegratedReportReadiness,
  IntegratedReportReviewItem,
  IntegratedReportStatus,
  IntegratedResearchReport,
  ResearchReport,
} from '@/types/research-report';

type IntegratedReportInput = Omit<ResearchReport, 'integratedReport'>;

function unique(items: Array<string | undefined>) {
  return Array.from(new Set(items.filter(Boolean))) as string[];
}

function integratedStatus(input: IntegratedReportInput): IntegratedReportStatus {
  if (
    input.status === 'fallback' ||
    input.sourceIngestionState.status === 'fallback' ||
    input.buySideReport.status === 'fallback' ||
    input.technicalDashboard.status === 'blocked'
  ) {
    return 'blocked';
  }

  if (
    input.sourceIngestionState.status !== 'strong' ||
    input.buySideReport.status !== 'generated' ||
    input.technicalDashboard.status !== 'adapted' ||
    input.evidenceLayer.summary.missingReferenceCount > 0 ||
    input.evidenceLayer.summary.warningCount > 0
  ) {
    return 'partial';
  }

  return 'ready';
}

function pillarStatus(input: {
  blocked?: boolean;
  ready?: boolean;
  warnings?: string[];
  missingCount?: number;
}): IntegratedReportPillarStatus {
  if (input.blocked) {
    return 'blocked';
  }

  if (input.ready && (input.warnings?.length ?? 0) === 0 && (input.missingCount ?? 0) === 0) {
    return 'ready';
  }

  if ((input.missingCount ?? 0) > 0 || (input.warnings?.length ?? 0) > 0) {
    return 'needs_review';
  }

  return 'partial';
}

function buildReadiness(input: IntegratedReportInput, status: IntegratedReportStatus): IntegratedReportReadiness {
  const warningCount = unique([
    ...input.sourceIngestionState.warnings,
    ...input.buySideReport.generationState.warnings,
    ...input.technicalDashboard.warnings,
  ]).length + input.evidenceLayer.summary.warningCount;

  return {
    status,
    generatedAt: input.updatedAt,
    sourceStatus: input.sourceIngestionState.status,
    buySideStatus: input.buySideReport.status,
    technicalStatus: input.technicalDashboard.status,
    evidenceMissingCount: input.evidenceLayer.summary.missingReferenceCount,
    warningCount,
    reviewRequired: status !== 'ready' || warningCount > 0,
  };
}

function firstEvidenceIds(input: IntegratedReportInput, limit = 6) {
  return unique([
    ...input.buySideReport.investmentView.evidenceIds,
    ...input.technicalDashboard.indicators.flatMap((indicator) => indicator.evidenceIds),
    ...input.evidenceReferences.map((evidence) => evidence.id),
  ]).slice(0, limit);
}

function firstFactIds(input: IntegratedReportInput, limit = 8) {
  return unique([
    ...input.buySideReport.investmentView.factIds,
    ...input.technicalDashboard.indicators.flatMap((indicator) => indicator.factIds),
    ...input.factReferences.map((fact) => fact.id),
  ]).slice(0, limit);
}

function buildPillars(input: IntegratedReportInput): IntegratedReportPillar[] {
  return [
    {
      id: 'source_ingestion',
      title: 'Source Ingestion',
      status: pillarStatus({
        blocked: input.sourceIngestionState.status === 'fallback',
        ready: input.sourceIngestionState.status === 'strong',
        warnings: input.sourceIngestionState.warnings,
      }),
      headline: `${input.sourceIngestionState.records.length} source records via ${input.sourceIngestionState.method}`,
      detail: `Coverage ${input.sourceIngestionState.coverage}; freshness ${input.sourceIngestionState.freshness}.`,
      evidenceIds: input.evidenceReferences.map((evidence) => evidence.id).slice(0, 6),
      factIds: input.factReferences.map((fact) => fact.id).slice(0, 8),
      warnings: input.sourceIngestionState.warnings,
    },
    {
      id: 'evidence_layer',
      title: 'Evidence Layer',
      status: pillarStatus({
        ready: input.evidenceLayer.summary.missingReferenceCount === 0,
        missingCount: input.evidenceLayer.summary.missingReferenceCount,
        warnings: input.evidenceLayer.missingReferences.map((item) => item.reason),
      }),
      headline: `${input.evidenceLayer.summary.linkedTargetCount} linked targets, ${input.evidenceLayer.summary.missingReferenceCount} missing`,
      detail: `${input.evidenceLayer.summary.evidenceReferenceCount} evidence references and ${input.evidenceLayer.summary.factReferenceCount} fact references are available.`,
      evidenceIds: firstEvidenceIds(input),
      factIds: firstFactIds(input),
      warnings: input.evidenceLayer.missingReferences.map((item) => item.reason),
    },
    {
      id: 'buy_side_report',
      title: 'Buy-Side Report',
      status: pillarStatus({
        blocked: input.buySideReport.status === 'fallback',
        ready: input.buySideReport.status === 'generated',
        warnings: input.buySideReport.generationState.warnings,
        missingCount: input.buySideReport.missingReferences.length,
      }),
      headline: input.buySideReport.investmentView.headline,
      detail: `${input.buySideReport.investmentView.bias} view with ${input.buySideReport.scenarios.length} scenario lanes and ${input.buySideReport.monitoringPlan.length} monitor items.`,
      evidenceIds: input.buySideReport.investmentView.evidenceIds,
      factIds: input.buySideReport.investmentView.factIds,
      warnings: input.buySideReport.generationState.warnings,
    },
    {
      id: 'technical_data',
      title: 'Technical Data',
      status: pillarStatus({
        blocked: input.technicalDashboard.status === 'blocked',
        ready: input.technicalDashboard.status === 'adapted',
        warnings: input.technicalDashboard.warnings,
      }),
      headline: `${input.technicalDashboard.summary.provider} / ${input.technicalDashboard.summary.adapterStatus}`,
      detail: `${input.technicalDashboard.indicators.length} indicators, ${input.technicalDashboard.zones.length} zones, live data ${input.technicalDashboard.summary.liveDataAvailable ? 'available' : 'not connected'}.`,
      evidenceIds: input.technicalDashboard.indicators.flatMap((indicator) => indicator.evidenceIds).slice(0, 6),
      factIds: input.technicalDashboard.indicators.flatMap((indicator) => indicator.factIds).slice(0, 8),
      warnings: input.technicalDashboard.warnings,
    },
    {
      id: 'follow_up_research',
      title: 'Follow-up Research',
      status: input.followUpResearch.length > 0 ? 'partial' : 'needs_review',
      headline: `${input.followUpResearch.length} follow-up tasks queued`,
      detail: 'Follow-up tasks are research actions for source review, assumption checks, and missing data closure.',
      evidenceIds: input.followUpResearch.flatMap((task) => task.evidenceIds),
      factIds: input.followUpResearch.flatMap((task) => task.factIds),
      warnings: input.followUpResearch.length > 0 ? [] : ['No follow-up research tasks are attached.'],
    },
  ];
}

function priorityForPillar(id: IntegratedReportPillarId): IntegratedReportPriority {
  if (id === 'source_ingestion' || id === 'evidence_layer') {
    return 'high';
  }

  if (id === 'buy_side_report' || id === 'technical_data') {
    return 'medium';
  }

  return 'low';
}

function buildReviewQueue(input: IntegratedReportInput, pillars: IntegratedReportPillar[]): IntegratedReportReviewItem[] {
  const pillarItems = pillars.flatMap((pillar) => (
    pillar.warnings.slice(0, 3).map((warning, index) => ({
      id: `review-${pillar.id}-${index + 1}`,
      priority: priorityForPillar(pillar.id),
      title: pillar.title,
      reason: warning,
      source: pillar.id,
      evidenceIds: pillar.evidenceIds,
      factIds: pillar.factIds,
    }))
  ));

  const missingItems = input.evidenceLayer.missingReferences.slice(0, 5).map((item, index) => ({
    id: `review-missing-reference-${index + 1}`,
    priority: item.severity === 'blocking' ? 'high' as const : 'medium' as const,
    title: item.target.label,
    reason: item.reason,
    source: 'evidence_layer' as const,
    evidenceIds: [],
    factIds: item.factIds,
  }));

  return [...pillarItems, ...missingItems].slice(0, 12);
}

function buildExecutiveNarrative(input: IntegratedReportInput) {
  const thesis = input.buySideReport.investmentView.thesis[0] ?? input.executiveSummary.currentState;
  const sourceState = input.sourceIngestionState.status;

  return `${thesis} Technical context is ${input.technicalDashboard.summary.adapterStatus} through ${input.technicalDashboard.summary.provider}; source ingestion is ${sourceState}.`;
}

export function buildIntegratedResearchReport(input: IntegratedReportInput): IntegratedResearchReport {
  const status = integratedStatus(input);
  const readiness = buildReadiness(input, status);
  const pillars = buildPillars(input);
  const reviewQueue = buildReviewQueue(input, pillars);

  return {
    id: `integrated-report-${input.slug}`,
    title: `${input.entity.ticker} Integrated Research Report`,
    status,
    generatedAt: input.updatedAt,
    headline: input.executiveSummary.oneLine,
    executiveNarrative: buildExecutiveNarrative(input),
    readiness,
    pillars,
    reviewQueue,
    sourceAudit: {
      sourceRecordCount: input.sourceIngestionState.records.length,
      evidenceReferenceCount: input.evidenceLayer.summary.evidenceReferenceCount,
      factReferenceCount: input.evidenceLayer.summary.factReferenceCount,
      linkedTargetCount: input.evidenceLayer.summary.linkedTargetCount,
      missingReferenceCount: input.evidenceLayer.summary.missingReferenceCount,
      fallbackEvidenceCount: input.evidenceLayer.summary.fallbackEvidenceCount,
      technicalProvider: input.technicalDashboard.summary.provider,
      liveTechnicalDataAvailable: input.technicalDashboard.summary.liveDataAvailable,
      sourceSummary: unique([
        ...input.sourceIngestionState.sourceSummary,
        ...input.technicalDashboard.dataSnapshot.sourceSummary,
      ]).slice(0, 10),
    },
    disclaimer: `${input.disclaimer} Integrated report output is a research workflow summary only; it is not investment advice, a rating, or a trading instruction.`,
  };
}
