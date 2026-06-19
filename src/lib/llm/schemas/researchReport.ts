import type {
  ResearchReport,
  ResearchReportClaim,
  ResearchReportExecutiveSummary,
  ResearchReportFollowUpTask,
  ResearchReportMetric,
  ResearchReportSection,
  ResearchReportSectionId,
  ResearchReportSectionItem,
  ResearchReportTone,
} from '@/types/research-report';

export interface ResearchReportPayload {
  title: string;
  subtitle: string;
  executiveSummary: ResearchReportExecutiveSummary;
  sections: ResearchReportSection[];
  followUpResearch: ResearchReportFollowUpTask[];
  disclaimer: string;
}

const sectionIds: ResearchReportSectionId[] = [
  'executive_summary',
  'earnings_guidance',
  'scenario_map',
  'evidence_references',
  'technical_context',
  'follow_up_research',
  'disclaimer',
];

const tones: ResearchReportTone[] = ['positive', 'neutral', 'negative', 'watch', 'cautious'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : [];
}

function normalizeTone(value: unknown): ResearchReportTone {
  return tones.includes(value as ResearchReportTone) ? value as ResearchReportTone : 'neutral';
}

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function normalizeIds(value: unknown, allowedIds: Set<string>, fallback: string[] = []) {
  const ids = stringArray(value).filter((id) => allowedIds.has(id));

  return Array.from(new Set(ids.length > 0 ? ids : fallback.filter((id) => allowedIds.has(id))));
}

function normalizeExecutiveSummary(raw: unknown, seed: ResearchReport): ResearchReportExecutiveSummary {
  const value = isRecord(raw) ? raw : {};

  return {
    oneLine: stringValue(value.oneLine, seed.executiveSummary.oneLine),
    currentState: stringValue(value.currentState, seed.executiveSummary.currentState),
    keyQuestion: stringValue(value.keyQuestion, seed.executiveSummary.keyQuestion),
    bullCase: stringValue(value.bullCase, seed.executiveSummary.bullCase ?? ''),
    bearCase: stringValue(value.bearCase, seed.executiveSummary.bearCase ?? ''),
  };
}

function normalizeClaims(
  raw: unknown,
  seedClaims: ResearchReportClaim[],
  sectionId: ResearchReportSectionId,
  evidenceIds: Set<string>,
  factIds: Set<string>
): ResearchReportClaim[] {
  const items = Array.isArray(raw) ? raw : [];
  const normalized = items
    .map((item, index): ResearchReportClaim | null => {
      if (!isRecord(item)) {
        return null;
      }

      const title = stringValue(item.title, seedClaims[index]?.title ?? `Claim ${index + 1}`);
      const body = stringValue(item.body, seedClaims[index]?.body ?? '');

      if (!body) {
        return null;
      }

      return {
        id: `${sectionId}-${slugPart(title)}-${index + 1}`,
        title,
        body,
        tone: normalizeTone(item.tone),
        evidenceIds: normalizeIds(item.evidenceIds, evidenceIds, seedClaims[index]?.evidenceIds),
        factIds: normalizeIds(item.factIds, factIds, seedClaims[index]?.factIds),
      };
    })
    .filter((item): item is ResearchReportClaim => Boolean(item))
    .slice(0, 6);

  return normalized.length > 0 ? normalized : seedClaims;
}

function normalizeMetrics(
  raw: unknown,
  seedMetrics: ResearchReportMetric[],
  evidenceIds: Set<string>,
  factIds: Set<string>
): ResearchReportMetric[] {
  const items = Array.isArray(raw) ? raw : [];
  const normalized = items
    .map((item, index): ResearchReportMetric | null => {
      if (!isRecord(item)) {
        return null;
      }

      const label = stringValue(item.label, seedMetrics[index]?.label ?? `Metric ${index + 1}`);
      const value = stringValue(item.value, seedMetrics[index]?.value ?? '');

      if (!value) {
        return null;
      }

      return {
        id: `metric-${slugPart(label)}-${index + 1}`,
        label,
        value,
        description: stringValue(item.description, seedMetrics[index]?.description ?? ''),
        whyItMatters: stringValue(item.whyItMatters, seedMetrics[index]?.whyItMatters ?? ''),
        evidenceIds: normalizeIds(item.evidenceIds, evidenceIds, seedMetrics[index]?.evidenceIds),
        factIds: normalizeIds(item.factIds, factIds, seedMetrics[index]?.factIds),
      };
    })
    .filter((item): item is ResearchReportMetric => Boolean(item))
    .slice(0, 8);

  return normalized.length > 0 ? normalized : seedMetrics;
}

function normalizeItems(
  raw: unknown,
  seedItems: ResearchReportSectionItem[],
  evidenceIds: Set<string>,
  factIds: Set<string>
): ResearchReportSectionItem[] {
  const items = Array.isArray(raw) ? raw : [];
  const normalized = items
    .map((item, index): ResearchReportSectionItem | null => {
      if (!isRecord(item)) {
        return null;
      }

      const title = stringValue(item.title, seedItems[index]?.title ?? `Item ${index + 1}`);
      const body = stringValue(item.body, seedItems[index]?.body ?? '');

      if (!body) {
        return null;
      }

      return {
        id: `item-${slugPart(title)}-${index + 1}`,
        title,
        body,
        evidenceIds: normalizeIds(item.evidenceIds, evidenceIds, seedItems[index]?.evidenceIds),
        factIds: normalizeIds(item.factIds, factIds, seedItems[index]?.factIds),
      };
    })
    .filter((item): item is ResearchReportSectionItem => Boolean(item))
    .slice(0, 10);

  return normalized.length > 0 ? normalized : seedItems;
}

function normalizeSection(
  rawSection: unknown,
  seedSection: ResearchReportSection,
  evidenceIds: Set<string>,
  factIds: Set<string>
): ResearchReportSection {
  const raw = isRecord(rawSection) ? rawSection : {};

  return {
    id: seedSection.id,
    title: stringValue(raw.title, seedSection.title),
    summary: stringValue(raw.summary, seedSection.summary),
    claims: normalizeClaims(raw.claims, seedSection.claims, seedSection.id, evidenceIds, factIds),
    metrics: normalizeMetrics(raw.metrics, seedSection.metrics, evidenceIds, factIds),
    items: normalizeItems(raw.items, seedSection.items, evidenceIds, factIds),
    missingData: stringArray(raw.missingData).slice(0, 8),
    evidenceIds: normalizeIds(raw.evidenceIds, evidenceIds, seedSection.evidenceIds),
    factIds: normalizeIds(raw.factIds, factIds, seedSection.factIds),
  };
}

function normalizeSections(raw: unknown, seed: ResearchReport): ResearchReportSection[] {
  const evidenceIds = new Set(seed.evidenceReferences.map((item) => item.id));
  const factIds = new Set(seed.factReferences.map((item) => item.id));
  const rawSections = Array.isArray(raw) ? raw.filter(isRecord) : [];

  return sectionIds.map((sectionId) => {
    const seedSection = seed.sections.find((section) => section.id === sectionId);

    if (!seedSection) {
      throw new Error(`Seed report is missing section ${sectionId}.`);
    }

    const rawSection = rawSections.find((section) => section.id === sectionId);

    return normalizeSection(rawSection, seedSection, evidenceIds, factIds);
  });
}

function normalizeFollowUp(raw: unknown, seed: ResearchReport): ResearchReportFollowUpTask[] {
  const evidenceIds = new Set(seed.evidenceReferences.map((item) => item.id));
  const factIds = new Set(seed.factReferences.map((item) => item.id));
  const items = Array.isArray(raw) ? raw : [];
  const normalized = items
    .map((item, index): ResearchReportFollowUpTask | null => {
      if (!isRecord(item)) {
        return null;
      }

      const task = stringValue(item.task, seed.followUpResearch[index]?.task ?? '');
      const whyItMatters = stringValue(item.whyItMatters, seed.followUpResearch[index]?.whyItMatters ?? '');

      if (!task || !whyItMatters) {
        return null;
      }

      return {
        id: `follow-up-${index + 1}`,
        task,
        whyItMatters,
        followUpDate: stringValue(item.followUpDate, seed.followUpResearch[index]?.followUpDate ?? ''),
        evidenceIds: normalizeIds(item.evidenceIds, evidenceIds, seed.followUpResearch[index]?.evidenceIds),
        factIds: normalizeIds(item.factIds, factIds, seed.followUpResearch[index]?.factIds),
      };
    })
    .filter((item): item is ResearchReportFollowUpTask => Boolean(item))
    .slice(0, 8);

  return normalized.length > 0 ? normalized : seed.followUpResearch;
}

function stripJsonFences(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  return fenced?.[1]?.trim() ?? trimmed;
}

export function parseResearchReportJson(text: string) {
  return JSON.parse(stripJsonFences(text)) as unknown;
}

export function validateResearchReportPayload(payload: unknown, seed: ResearchReport): ResearchReportPayload {
  if (!isRecord(payload)) {
    throw new Error('ResearchReport payload must be a JSON object.');
  }

  return {
    title: stringValue(payload.title, seed.title),
    subtitle: stringValue(payload.subtitle, seed.subtitle),
    executiveSummary: normalizeExecutiveSummary(payload.executiveSummary, seed),
    sections: normalizeSections(payload.sections, seed),
    followUpResearch: normalizeFollowUp(payload.followUpResearch, seed),
    disclaimer: stringValue(payload.disclaimer, seed.disclaimer),
  };
}
