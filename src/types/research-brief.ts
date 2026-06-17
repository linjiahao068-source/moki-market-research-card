export type ResearchBriefProvider = 'disabled' | 'fallback' | 'ark' | 'deepseek' | 'openai-compatible';

export type ResearchBriefGenerationMode = 'llm' | 'deterministic-fallback';

export type ResearchBriefStatus = 'generated' | 'fallback' | 'disabled' | 'error';

export type ResearchBriefModuleId = 'earnings_snapshot' | 'company_guidance' | 'scenario_readthrough';

export type ResearchBriefTone = 'positive' | 'neutral' | 'negative' | 'watch';

export interface ResearchBriefClaim {
  id: string;
  title: string;
  body: string;
  tone: ResearchBriefTone;
  confidence: number;
  evidenceIds: string[];
}

export interface ResearchBriefModule {
  id: ResearchBriefModuleId;
  title: string;
  summary: string;
  claims: ResearchBriefClaim[];
  missingData: string[];
  evidenceIds: string[];
}

export interface ResearchBrief {
  version: 'v0.3.3';
  ticker?: string;
  generatedAt: string;
  provider: ResearchBriefProvider;
  model?: string;
  generationMode: ResearchBriefGenerationMode;
  status: ResearchBriefStatus;
  headline: string;
  executiveSummary: string;
  modules: ResearchBriefModule[];
  uncertainties: string[];
  evidenceRefs: string[];
  warnings: string[];
}
