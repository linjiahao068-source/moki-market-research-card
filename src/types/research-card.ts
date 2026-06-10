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
  followUpDate: string;
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
    value: string;
    note?: string;
  }>;
  risks: string[];
}

export interface Events {
  policy: string[];
  product: string[];
  macro: string[];
  earningsCalendar: Array<{
    date: string;
    event: string;
  }>;
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
  ticker: string;
  companyName: string;
  title: string;
  subtitle: string;
  updatedAt: string;
  cardType: string;
  summary: string;
  sentiment: Sentiment;
  fundamentals: Fundamentals;
  events: Events;
  technicalContext: TechnicalContext;
  evidence: Evidence[];
  nextSteps: NextStep[];
  disclaimer: string;
}
