import type { ResearchCard } from '@/types/research-card';
import { RESEARCH_REPORT_SCHEMA_VERSION } from '@/types/research-report';
import { buildEvidenceReferenceLayer } from './evidenceReferenceLayer';
import { generateBuySideReport } from './buySideReportGenerator';
import { buildTechnicalDashboardFromAdapter } from './technicalDataAdapter';
import { ingestResearchSourcesFromCard } from './sourceIngestion';
import type {
  ResearchReport,
  ResearchReportClaim,
  ResearchReportFactReference,
  ResearchReportFollowUpTask,
  ResearchReportMetric,
  ResearchReportSection,
  ResearchReportSectionId,
  ResearchReportStatus,
  ResearchReportTone,
} from '@/types/research-report';

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
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

export function buildResearchReportFromCard(card: ResearchCard): ResearchReport {
  const {
    evidenceReferences,
    factReferences,
    sourceIngestionState,
  } = ingestResearchSourcesFromCard(card);
  const allEvidenceIds = evidenceReferences.map((item) => item.id);
  const allFactIds = factReferences.map((item) => item.id);
  const generatedAt = card.generatedAt ?? card.updatedAt;
  const sourceWarnings = sourceIngestionState.warnings;

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
      items: card.technicalContext.keyZones.map((zone, index) => ({
        id: `technical-zone-${index + 1}`,
        title: `${zone.type}: ${zone.level}`,
        body: zone.note ?? 'Technical zone from legacy context; adapter evidence pending.',
        evidenceIds: [],
        factIds: [],
      })),
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

  const reportBase: Omit<ResearchReport, 'evidenceLayer' | 'buySideReport' | 'technicalDashboard'> = {
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
    sourceIngestionState,
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

  const reportWithEvidenceLayer: Omit<ResearchReport, 'buySideReport' | 'technicalDashboard'> = {
    ...reportBase,
    evidenceLayer: buildEvidenceReferenceLayer(reportBase),
  };

  const reportWithBuySide: Omit<ResearchReport, 'technicalDashboard'> = {
    ...reportWithEvidenceLayer,
    buySideReport: generateBuySideReport(reportWithEvidenceLayer),
  };

  return {
    ...reportWithBuySide,
    technicalDashboard: buildTechnicalDashboardFromAdapter(reportWithBuySide),
  };
}
