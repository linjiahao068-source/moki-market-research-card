import type { ResearchBriefProvider } from './research-brief';

export type SerenityMemoGenerationMode = 'llm' | 'deterministic-fallback';

export type SerenityMemoStatus = 'generated' | 'fallback' | 'disabled' | 'error';

export type SerenitySkillId =
  | 'buy_side_memo'
  | 'serenity_alpha'
  | 'bayesian'
  | 'gf_dma'
  | 'tam_adj_peg';

export type SerenityMemoTone = 'positive' | 'neutral' | 'cautious' | 'watch';

export interface SerenityMemoObservation {
  id: string;
  title: string;
  body: string;
  tone: SerenityMemoTone;
  confidence: number;
  evidenceIds: string[];
  calculationRefs: string[];
}

export interface SerenityMemoSkillCard {
  id: SerenitySkillId;
  title: string;
  frameworkQuestion: string;
  overview: string;
  observations: SerenityMemoObservation[];
  variables: string[];
  debates: string[];
  watchItems: string[];
  missingData: string[];
  evidenceIds: string[];
  calculationRefs: string[];
}

export interface SerenityMemo {
  version: 'v0.3.4';
  ticker?: string;
  generatedAt: string;
  provider: ResearchBriefProvider;
  model?: string;
  generationMode: SerenityMemoGenerationMode;
  status: SerenityMemoStatus;
  headline: string;
  executiveSummary: string;
  skillCards: SerenityMemoSkillCard[];
  crossSkillTensions: string[];
  watchItems: string[];
  dataLimitations: string[];
  evidenceRefs: string[];
  calculationRefs: string[];
  warnings: string[];
}
