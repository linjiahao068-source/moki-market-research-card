import type { LLMResearchInput } from '@/types/evidence';
import type {
  ResearchBrief,
  ResearchBriefClaim,
  ResearchBriefModule,
  ResearchBriefModuleId,
  ResearchBriefProvider,
  ResearchBriefTone,
} from '@/types/research-brief';

const moduleIds: ResearchBriefModuleId[] = ['earnings_snapshot', 'company_guidance', 'scenario_readthrough'];
const tones: ResearchBriefTone[] = ['positive', 'neutral', 'negative', 'watch'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : [];
}

function numberValue(value: unknown, fallback = 0.5) {
  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, parsed));
}

function normalizeTone(value: unknown): ResearchBriefTone {
  return tones.includes(value as ResearchBriefTone) ? value as ResearchBriefTone : 'neutral';
}

function normalizeModuleId(value: unknown): ResearchBriefModuleId | null {
  return moduleIds.includes(value as ResearchBriefModuleId) ? value as ResearchBriefModuleId : null;
}

function moduleTitle(id: ResearchBriefModuleId) {
  if (id === 'earnings_snapshot') {
    return '财报快照';
  }

  if (id === 'company_guidance') {
    return '公司指引';
  }

  return '买方情景推演';
}

export function stripJsonFences(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

export function parseResearchBriefJson(text: string) {
  return JSON.parse(stripJsonFences(text)) as unknown;
}

function normalizeClaim({
  rawClaim,
  evidenceIdSet,
  moduleId,
  index,
}: {
  rawClaim: unknown;
  evidenceIdSet: Set<string>;
  moduleId: ResearchBriefModuleId;
  index: number;
}): ResearchBriefClaim | null {
  if (!isRecord(rawClaim)) {
    return null;
  }

  const evidenceIds = stringArray(rawClaim.evidenceIds).filter((id) => evidenceIdSet.has(id));

  if (evidenceIds.length === 0) {
    return null;
  }

  const title = stringValue(rawClaim.title, moduleTitle(moduleId));
  const body = stringValue(rawClaim.body);

  if (!body) {
    return null;
  }

  return {
    id: `${moduleId}-claim-${index + 1}`,
    title,
    body,
    tone: normalizeTone(rawClaim.tone),
    confidence: numberValue(rawClaim.confidence),
    evidenceIds: Array.from(new Set(evidenceIds)).slice(0, 6),
  };
}

function emptyModule(id: ResearchBriefModuleId, missingData: string[] = []): ResearchBriefModule {
  return {
    id,
    title: moduleTitle(id),
    summary: '当前证据不足，暂不生成该模块结论。',
    claims: [],
    missingData,
    evidenceIds: [],
  };
}

function normalizeModule(rawModule: unknown, evidenceIdSet: Set<string>): ResearchBriefModule | null {
  if (!isRecord(rawModule)) {
    return null;
  }

  const id = normalizeModuleId(rawModule.id);

  if (!id) {
    return null;
  }

  const claims = Array.isArray(rawModule.claims)
    ? rawModule.claims
        .map((claim, index) => normalizeClaim({ rawClaim: claim, evidenceIdSet, moduleId: id, index }))
        .filter((claim): claim is ResearchBriefClaim => Boolean(claim))
    : [];
  const evidenceIds = Array.from(new Set(claims.flatMap((claim) => claim.evidenceIds)));
  const summary = stringValue(
    rawModule.summary,
    claims.length > 0 ? claims[0].body : '当前证据不足，暂不生成该模块结论。'
  );

  return {
    id,
    title: stringValue(rawModule.title, moduleTitle(id)),
    summary,
    claims,
    missingData: stringArray(rawModule.missingData),
    evidenceIds,
  };
}

export function validateResearchBriefPayload({
  payload,
  input,
  provider,
  model,
  warnings = [],
}: {
  payload: unknown;
  input: LLMResearchInput;
  provider: ResearchBriefProvider;
  model?: string;
  warnings?: string[];
}): ResearchBrief {
  if (!isRecord(payload)) {
    throw new Error('Research brief payload must be a JSON object.');
  }

  const evidenceIdSet = new Set(input.evidence.map((item) => item.id));
  const rawModules = Array.isArray(payload.modules) ? payload.modules : [];
  const normalizedModules = rawModules
    .map((item) => normalizeModule(item, evidenceIdSet))
    .filter((item): item is ResearchBriefModule => Boolean(item));
  const moduleMap = new Map(normalizedModules.map((module) => [module.id, module]));
  const modules = moduleIds.map((id) => moduleMap.get(id) ?? emptyModule(id, [`${moduleTitle(id)}缺少可引用证据。`]));
  const evidenceRefs = Array.from(new Set(modules.flatMap((module) => module.evidenceIds)));

  if (modules.every((module) => module.claims.length === 0)) {
    throw new Error('Research brief did not include any claim with valid evidenceIds.');
  }

  return {
    version: 'v0.3.3',
    ticker: input.ticker,
    generatedAt: new Date().toISOString(),
    provider,
    model,
    generationMode: 'llm',
    status: 'generated',
    headline: stringValue(payload.headline, `${input.ticker ?? 'Company'} 研究摘要`).slice(0, 120),
    executiveSummary: stringValue(payload.executiveSummary, '模型已基于可用证据生成结构化研究摘要。'),
    modules,
    uncertainties: stringArray(payload.uncertainties).slice(0, 8),
    evidenceRefs,
    warnings,
  };
}

export function isValidLlmResearchInput(input: unknown): input is LLMResearchInput {
  if (!isRecord(input)) {
    return false;
  }

  return Array.isArray(input.facts) &&
    Array.isArray(input.evidence) &&
    isRecord(input.dataQuality) &&
    Array.isArray(input.complianceRules);
}
