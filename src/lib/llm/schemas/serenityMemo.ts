import type { LLMResearchInput } from '@/types/evidence';
import type {
  SerenityMemo,
  SerenityMemoObservation,
  SerenityMemoSkillCard,
  SerenityMemoTone,
  SerenitySkillId,
} from '@/types/serenity-memo';
import type { ResearchBriefProvider } from '@/types/research-brief';
import { stripJsonFences } from './researchBrief';

const skillIds: SerenitySkillId[] = ['buy_side_memo', 'serenity_alpha', 'bayesian', 'gf_dma', 'tam_adj_peg'];
const tones: SerenityMemoTone[] = ['positive', 'neutral', 'cautious', 'watch'];

const skillTitles: Record<SerenitySkillId, string> = {
  buy_side_memo: '买方研究备忘录',
  serenity_alpha: 'Serenity Alpha',
  bayesian: '贝叶斯估值',
  gf_dma: 'GF-DMA 健康指数',
  tam_adj_peg: 'TAM-Adj-PEG',
};

const skillQuestions: Record<SerenitySkillId, string> = {
  buy_side_memo: '把财报、指引、估值和情景推演合成一个可验证的买方研究假设。',
  serenity_alpha: '识别当前证据是否足以形成 Alpha 假设。',
  bayesian: '判断新增证据如何改变增长与估值假设。',
  gf_dma: '检查基本面速度与趋势健康度是否匹配。',
  tam_adj_peg: '用增长、估值和市场空间共同复核 PEG 解释力。',
};

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

function normalizeTone(value: unknown): SerenityMemoTone {
  return tones.includes(value as SerenityMemoTone) ? value as SerenityMemoTone : 'neutral';
}

function normalizeSkillId(value: unknown): SerenitySkillId | null {
  return skillIds.includes(value as SerenitySkillId) ? value as SerenitySkillId : null;
}

export function parseSerenityMemoJson(text: string) {
  return JSON.parse(stripJsonFences(text)) as unknown;
}

function emptySkillCard(id: SerenitySkillId, missingData: string[] = []): SerenityMemoSkillCard {
  return {
    id,
    title: skillTitles[id],
    frameworkQuestion: skillQuestions[id],
    overview: '当前证据不足，暂不生成该框架的强结论。',
    observations: [],
    variables: [],
    debates: [],
    watchItems: [],
    missingData,
    evidenceIds: [],
    calculationRefs: [],
  };
}

function normalizeObservation({
  rawObservation,
  evidenceIdSet,
  factIdSet,
  skillId,
  index,
}: {
  rawObservation: unknown;
  evidenceIdSet: Set<string>;
  factIdSet: Set<string>;
  skillId: SerenitySkillId;
  index: number;
}): SerenityMemoObservation | null {
  if (!isRecord(rawObservation)) {
    return null;
  }

  const evidenceIds = stringArray(rawObservation.evidenceIds).filter((id) => evidenceIdSet.has(id));
  const calculationRefs = stringArray(rawObservation.calculationRefs).filter((id) => factIdSet.has(id));

  if (evidenceIds.length === 0 || calculationRefs.length === 0) {
    return null;
  }

  const title = stringValue(rawObservation.title, skillTitles[skillId]);
  const body = stringValue(rawObservation.body);

  if (!body) {
    return null;
  }

  return {
    id: `${skillId}-observation-${index + 1}`,
    title,
    body,
    tone: normalizeTone(rawObservation.tone),
    confidence: numberValue(rawObservation.confidence),
    evidenceIds: Array.from(new Set(evidenceIds)).slice(0, 6),
    calculationRefs: Array.from(new Set(calculationRefs)).slice(0, 6),
  };
}

function normalizeSkillCard(rawCard: unknown, evidenceIdSet: Set<string>, factIdSet: Set<string>): SerenityMemoSkillCard | null {
  if (!isRecord(rawCard)) {
    return null;
  }

  const id = normalizeSkillId(rawCard.id);

  if (!id) {
    return null;
  }

  const observations = Array.isArray(rawCard.observations)
    ? rawCard.observations
        .map((observation, index) => normalizeObservation({
          rawObservation: observation,
          evidenceIdSet,
          factIdSet,
          skillId: id,
          index,
        }))
        .filter((observation): observation is SerenityMemoObservation => Boolean(observation))
        .slice(0, 3)
    : [];
  const evidenceIds = Array.from(new Set(observations.flatMap((observation) => observation.evidenceIds)));
  const calculationRefs = Array.from(new Set(observations.flatMap((observation) => observation.calculationRefs)));
  const missingData = stringArray(rawCard.missingData).slice(0, 6);

  return {
    id,
    title: stringValue(rawCard.title, skillTitles[id]),
    frameworkQuestion: stringValue(rawCard.frameworkQuestion, skillQuestions[id]),
    overview: stringValue(
      rawCard.overview,
      observations.length > 0 ? observations[0].body : '当前证据不足，暂不生成该框架的强结论。'
    ),
    observations,
    variables: stringArray(rawCard.variables).slice(0, 6),
    debates: stringArray(rawCard.debates).slice(0, 5),
    watchItems: stringArray(rawCard.watchItems).slice(0, 6),
    missingData: observations.length > 0 ? missingData : Array.from(new Set([...missingData, `${skillTitles[id]} 缺少可引用证据或计算引用。`])),
    evidenceIds,
    calculationRefs,
  };
}

export function validateSerenityMemoPayload({
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
}): SerenityMemo {
  if (!isRecord(payload)) {
    throw new Error('Serenity memo payload must be a JSON object.');
  }

  const evidenceIdSet = new Set(input.evidence.map((item) => item.id));
  const factIdSet = new Set(input.facts.map((fact) => fact.id));
  const rawCards = Array.isArray(payload.skillCards) ? payload.skillCards : [];
  const normalizedCards = rawCards
    .map((item) => normalizeSkillCard(item, evidenceIdSet, factIdSet))
    .filter((item): item is SerenityMemoSkillCard => Boolean(item));
  const cardMap = new Map(normalizedCards.map((card) => [card.id, card]));
  const skillCards = skillIds.map((id) => cardMap.get(id) ?? emptySkillCard(id, [`${skillTitles[id]} 缺少模块输出。`]));
  const evidenceRefs = Array.from(new Set(skillCards.flatMap((card) => card.evidenceIds)));
  const calculationRefs = Array.from(new Set(skillCards.flatMap((card) => card.calculationRefs)));

  if (skillCards.every((card) => card.observations.length === 0)) {
    throw new Error('Serenity memo did not include any observation with valid evidenceIds and calculationRefs.');
  }

  return {
    version: 'v0.3.4',
    ticker: input.ticker,
    generatedAt: new Date().toISOString(),
    provider,
    model,
    generationMode: 'llm',
    status: 'generated',
    headline: stringValue(payload.headline, `${input.ticker ?? '公司'} Serenity Skill Memo`).slice(0, 120),
    executiveSummary: stringValue(payload.executiveSummary, '模型已基于可用 facts/evidence 生成 Serenity 结构化 memo。'),
    skillCards,
    crossSkillTensions: stringArray(payload.crossSkillTensions).slice(0, 6),
    watchItems: stringArray(payload.watchItems).slice(0, 8),
    dataLimitations: stringArray(payload.dataLimitations).slice(0, 8),
    evidenceRefs,
    calculationRefs,
    warnings,
  };
}
