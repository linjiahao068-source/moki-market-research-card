export interface Evidence {
  id: string;
  sourceLabel: string;
  sourceType: string;
  timestamp: string;
  summary: string;
  confidence: number;
}

export interface NextStep {
  task: string;
  whyItMatters: string;
  followUpDate?: string;
}

export interface Summary {
  oneLine: string;
  currentState: string;
  keyQuestion: string;
  bullCase?: string;
  bearCase?: string;
}

export interface Sentiment {
  heatLevel: number;
  direction: string;
  disagreement: number;
  keyDebates: string[];
}

export interface Fundamentals {
  businessModel: string;
  revenueDrivers: string[];
  keyMetrics: Array<{
    label: string;
    description: string;
    whyItMatters: string;
  }>;
  risks: string[];
}

export interface ResearchEvent {
  type: string;
  title: string;
  description: string;
  impactQuestion: string;
}

export interface Events {
  items: ResearchEvent[];
}

export interface TechnicalContext {
  priceAction: string;
  volume: string;
  optionsIv: string;
  keyZones: Array<{
    type: string;
    level: string;
    note?: string;
  }>;
  note: string;
}

export interface ResearchCard {
  slug: string;
  ticker: string;
  companyName: string;
  title: string;
  subtitle: string;
  cardType: string;
  updatedAt: string;
  isMock: boolean;
  summary: Summary;
  sentiment: Sentiment;
  fundamentals: Fundamentals;
  events: Events;
  technicalContext: TechnicalContext;
  evidence: Evidence[];
  nextSteps: NextStep[];
  disclaimer: string;
  sections?: Array<{
    title: string;
    body: string;
  }>;
  keySignals?: string[];
  risks?: string[];
  sourceNote?: string;
  queryInput?: string;
  market?: string;
  numericCode?: string;
  chineseName?: string;
  matchStatus?: 'matched' | 'unmatched';
  matchType?: 'symbol' | 'numericCode' | 'chineseName';
  // Optional: 新增估值情景字段，侵入最小
  valuationScenarios?: unknown;
}
