import type { GuidanceMetricComparison } from '@/types/earnings';
import type { GlobalGuidanceEvidence } from '@/types/global-stock-data';

export interface GuidanceDataResult {
  guidance: GuidanceMetricComparison[];
  guidanceEvidence: GlobalGuidanceEvidence[];
  source: string;
  confidence: number;
  warnings: string[];
}
